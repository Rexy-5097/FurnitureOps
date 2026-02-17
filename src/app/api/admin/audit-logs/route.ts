import { getServiceSupabase } from '@/lib/supabase';
import { validateAdminRequest } from '@/lib/auth-guard';
import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await validateAdminRequest(req);
    const supabase = getServiceSupabase();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(logs);

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
