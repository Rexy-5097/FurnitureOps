import { getServiceSupabase } from '@/lib/supabase';
import { validateAdminRequest } from '@/lib/auth-guard';
import { Database } from '@/types/database';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await validateAdminRequest(req);
    const body = await req.json();

    if (body.confirmation_code !== 'DELETE-ALL-INVENTORY-PERMANENTLY') {
      return NextResponse.json({ error: 'Invalid Confirmation Code' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Perform deletion directly using Service Role (bypasses RLS)
    const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (UUIDs are never all zeros normally, or just use a condition that is always true)

    if (deleteError) {
      console.error('Delete Error:', deleteError);
      throw new Error('Failed to wipe inventory');
    }

    // Insert Audit Log
    const logEntry: Database['public']['Tables']['audit_logs']['Insert'] = {
        action: 'KILL_SWITCH_ACTIVATED',
        actor_id: user.id,
        details: {
            source: 'manual',
            ip_hint: req.headers.get('x-forwarded-for') ?? 'unknown'
        }
    };

    const { error: auditError } = await supabase
        .from('audit_logs')
        // @ts-expect-error - Supabase type inference mismatch for verified runtime code
        .insert(logEntry);

    if (auditError) {
       console.error('Audit Error:', auditError);
       const fs = require('fs');
       fs.appendFileSync('debug_error.log', new Date().toISOString() + ' - Audit Error in Kill Switch: ' + JSON.stringify(auditError) + '\n');
    }

    return NextResponse.json({ message: 'Inventory System Reset' }, { status: 200 });

  } catch (error: any) {
    if (error.message === 'Missing Token' || error.message === 'Invalid Token') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === 'Unauthorized: User is not an Admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
