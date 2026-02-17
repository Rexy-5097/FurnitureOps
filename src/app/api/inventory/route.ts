import { getServiceSupabase } from '@/lib/supabase';
import { validateAdminRequest } from '@/lib/auth-guard';
import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  const supabase = getServiceSupabase();
  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(inventory);
}

export async function POST(req: Request) {
  try {
    const user = await validateAdminRequest(req);
    const body = await req.json();
    const { name, price, origin, quantity_available, image_url } = body;

    // Validate invariants
    if (price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }
    if (quantity_available < 0) {
      return NextResponse.json({ error: 'Quantity available must be non-negative' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: item, error } = await supabase
      .from('inventory')
      // @ts-expect-error Supabase Insert type inference mismatch
      .insert({
        name,
        price,
        origin,
        quantity_available,
        quantity_sold: 0,
        image_url,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('audit_logs')
      // @ts-expect-error Supabase Insert type inference mismatch
      .insert({
      action: 'CREATE_ITEM',
      actor_id: user.id,
      details: { name },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    const fs = require('fs');
    fs.appendFileSync('debug_error.log', new Date().toISOString() + ' - Error in POST /api/inventory: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\n');
    
    if (error.message === 'Missing Token' || error.message === 'Invalid Token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === 'Unauthorized: User is not an Admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
