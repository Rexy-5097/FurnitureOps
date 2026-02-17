import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Create a local client for auth (since we don't have service role for strictly signing in users as themselves via API usually, 
// but we can use the anon key and let supabase handle it. 
// OR use createServerClient if we were setting cookies, but here we just return the session data.)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function hashEmail(email: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  // Safe IP extraction
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailHash = await hashEmail(email);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Login failed', {
        requestId,
        route: '/api/auth/login',
        action: 'LOGIN_ATTEMPT',
        status: 401,
        durationMs: Date.now() - startTime,
        details: { ip, error: error.message, emailHash } 
      });
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    logger.info('Login successful', {
        requestId,
        userId: data.session.user.id,
        route: '/api/auth/login',
        action: 'LOGIN_SUCCESS',
        status: 200,
        durationMs: Date.now() - startTime,
        details: { ip, emailHash }
    });


    return NextResponse.json(data);

  } catch (error: any) {
    logger.error('Login error', {
        requestId,
        route: '/api/auth/login',
        status: 500,
        details: { ip, error: error.message }
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
