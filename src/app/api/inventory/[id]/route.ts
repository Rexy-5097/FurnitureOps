import { getServiceSupabase } from '@/lib/supabase';
import { validateAdminRequest } from '@/lib/auth-guard';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { lockIdempotency } from '@/lib/idempotency';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  try {
    const user = await validateAdminRequest(req);
    const body = await req.json();

    // 0. Idempotency Check
    const { locked, response } = await lockIdempotency(req, body);
    if (!locked && response) {
       logger.info('Idempotency hit', { requestId, route: `/api/inventory/${params.id}`, action: 'IDEMPOTENCY_HIT' });
       return response;
    }



    const supabase = getServiceSupabase();

    // PATH A: Atomic Stock Decrement (Transactional)
    if (body.decrement) {
      const quantity = Number(body.decrement);
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Decrement must be a positive number' }, { status: 400 });
      }

      const idempotencyKey = req.headers.get('Idempotency-Key');
      if (!idempotencyKey) {
          // Should have been handled by lock check, but strict type safety
          return NextResponse.json({ error: 'Idempotency Key missing' }, { status: 400 });
      }

      // OCC Workaround: Client-side Optimistic Concurrency Control
      // Since we don't have the RPC function and lack DB access to create it.
      let retries = 3;
      while (retries > 0) {
        // 1. Fetch current item state
        const { data: currentItemRaw, error: fetchError } = await supabase
          .from('inventory')
          .select('quantity_available, quantity_sold')
          .eq('id', params.id)
          .single();
        
        const currentItem = currentItemRaw as any;

        if (fetchError || !currentItem) {
           return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (currentItem.quantity_available < quantity) {
           return NextResponse.json({ error: 'Insufficient stock' }, { status: 409 });
        }

        // 2. Attempt Conditional Update (Optimistic Lock)
        const { data: updatedItem, error: updateError } = await (supabase as any)
          .from('inventory')
          .update({ 
            quantity_available: currentItem.quantity_available - quantity,
            quantity_sold: (currentItem.quantity_sold || 0) + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('quantity_available', currentItem.quantity_available) // The Lock Condition
          .select()
          .single(); // Will return null if condition failed (i.e. row wasn't updated)
        
        if (!updateError && updatedItem) {
          // Success!
          
          // 3. Log Audit
          await (supabase as any).from('audit_logs').insert({
            action: 'STOCK_DECREMENT',
            actor_id: user.id,
            details: { 
              item_id: params.id, 
              quantity: quantity,
              new_stock: updatedItem.quantity_available
            }
          });

          // 4. Commit Idempotency manually (since RPC isn't doing it)
           const { commitIdempotency } = await import('@/lib/idempotency');
           await commitIdempotency(req, body, updatedItem, 200);

          logger.info('Stock decremented (OCC)', {
            requestId,
            userId: user.id,
            route: `/api/inventory/${params.id}`,
            action: 'DECREMENT',
            status: 200,
            durationMs: Date.now() - startTime
          });
          
          return NextResponse.json(updatedItem);
        }
        
        // If we are here, update failed (likely concurrency). Retry.
        retries--;
        await new Promise(r => setTimeout(r, 50 * (3 - retries))); // Jitter
      }

      return NextResponse.json({ error: 'Failed to update stock due to high concurrency' }, { status: 409 });
    }

    // PATH B: Standard Edit (Name, Price, Origin, manual Qty override)
    // Validate invariants for manual update
    if (body.quantity_available !== undefined && body.quantity_available < 0) {
      return NextResponse.json({ error: 'Quantity available must be non-negative' }, { status: 400 });
    }
    if (body.quantity_sold !== undefined && body.quantity_sold < 0) {
      return NextResponse.json({ error: 'Quantity sold must be non-negative' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('inventory')
      // @ts-expect-error Supabase Update type inference mismatch
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Update item failed', {
          requestId,
          userId: user.id,
          route: `/api/inventory/${params.id}`,
          action: 'UPDATE',
          details: { error: error.message }
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('audit_logs')
      // @ts-expect-error Supabase Insert type inference mismatch
      .insert({
      action: 'UPDATE_ITEM',
      actor_id: user.id,
      details: { id: params.id, changes: Object.keys(body) },
    });

    logger.info('Item updated', {
        requestId,
        userId: user.id,
        route: `/api/inventory/${params.id}`,
        action: 'UPDATE',
        status: 200,
        durationMs: Date.now() - startTime
    });

    return NextResponse.json(item);

  } catch (error: any) {
    if (error.message === 'Missing Token' || error.message === 'Invalid Token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === 'Unauthorized: User is not an Admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error('Internal Server Error', {
        requestId,
        route: `/api/inventory/${params.id}`,
        status: 500,
        details: { error: error.message }
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await validateAdminRequest(req);
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('audit_logs')
      // @ts-expect-error Supabase Insert type inference mismatch
      .insert({
      action: 'DELETE_ITEM',
      actor_id: user.id,
      details: { id: params.id },
    });

    return NextResponse.json({ message: 'Item deleted' }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Missing Token' || error.message === 'Invalid Token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === 'Unauthorized: User is not an Admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
