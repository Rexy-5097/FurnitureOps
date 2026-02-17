import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface IdempotencyLock {
  locked: boolean;
  response?: NextResponse;
}

// COMMENTED OUT: In-memory store was Dev / Fallback — PRODUCTION PARITY requires Supabase only
// const memoryStore = new Map<string, { status: number; body: unknown; hash: string; timestamp: number }>();
// const TTL = 60 * 1000;

async function generateHash(data: unknown): Promise<string> {
  const str = JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Attempts to LOCK the idempotency key.
 * If successful, returns { locked: true } -> Proceed with operation.
 * If failed (exists), returns { locked: false, response: ... } -> Return cached response.
 * 
 * PRODUCTION PARITY: Always uses Supabase. No in-memory fallback.
 */
export async function lockIdempotency(req: Request, body: unknown): Promise<IdempotencyLock> {
  const key = req.headers.get('Idempotency-Key');
  if (!key) return { locked: true }; // No key, proceed (or error if strictly required)

  const hash = await generateHash(body);

  // PRODUCTION MODE: Supabase (ALWAYS)
  const supabase = getServiceSupabase() as any;
  
  // 1. Attempt INSERT (Processing State)
  const { error } = await supabase.from('idempotency_keys').insert({
    key,
    request_hash: hash,
    response_status: 202, // Processing
    response_body: null
  });

  // Success -> Lock Acquired
  if (!error) {
    return { locked: true };
  }

  // Constraint Violation -> Key Exists
  if (error.code === '23505') { // Unique Violation
    // 2. Fetch Existing
    const { data, error: fetchError } = await supabase
      .from('idempotency_keys')
      .select('*')
      .eq('key', key)
      .single();
    
    if (fetchError || !data) {
      logger.error('Idempotency Fetch Failed', { details: { error: fetchError?.message } });
      // FAIL-CLOSED: Do NOT allow duplicate processing on fetch error
      return {
        locked: false,
        response: NextResponse.json(
          { error: 'Idempotency service unavailable' },
          { status: 503, headers: { 'Retry-After': '5' } }
        )
      };
    }

    // Hash Mismatch -> CONFLICT
    if (data.request_hash !== hash) {
      return { 
        locked: false, 
        response: NextResponse.json({ error: 'Idempotency key reused with different payload' }, { status: 409 }) 
      };
    }

    // Check if Processing
    if (data.response_status === 202) {
        // CRASH RECOVERY: Atomic Takeover via RPC
        const { data: claimed, error: claimError } = await supabase
           .rpc('claim_stale_idempotency_key', { p_key: key });
        
        if (!claimError && claimed && claimed.length > 0) {
            logger.warn('Idempotency Crash Recovery: Lock Acquired', { details: { key } });
            return { locked: true }; 
        }

       return {
         locked: false,
         response: NextResponse.json({ error: 'Processing' }, { status: 409 })
       };
    }

    // Done -> Return Cached
    return {
      locked: false,
      response: NextResponse.json(data.response_body, { status: data.response_status })
    };
  }

  // FAIL-CLOSED: Unknown DB error → reject with 503 (do NOT allow duplicate processing)
  console.error('CRITICAL IDEMPOTENCY ERROR:', error);
  logger.error('Idempotency Insert Error', { details: { error: error.message, code: error.code } });
  return {
    locked: false,
    response: NextResponse.json(
      { error: 'Idempotency service error' },
      { status: 503, headers: { 'Retry-After': '5' } }
    )
  };

  // COMMENTED OUT: Dev mode in-memory fallback — PRODUCTION PARITY requires Supabase only
  // if (memoryStore.has(key)) {
  //    const cached = memoryStore.get(key)!;
  //    if (cached.hash !== hash) return { locked: false, response: NextResponse.json({ error: 'Mismatch' }, { status: 409 }) };
  //    if (cached.status === 202) return { locked: false, response: NextResponse.json({ error: 'Processing' }, { status: 409 }) };
  //    return { locked: false, response: NextResponse.json(cached.body, { status: cached.status }) };
  // }
  // 
  // memoryStore.set(key, { status: 202, hash, body: null, timestamp: Date.now() });
  // return { locked: true };
}

export async function commitIdempotency(req: Request, body: unknown, responseBody: unknown, status: number) {
  const key = req.headers.get('Idempotency-Key');
  if (!key) return;

  // PRODUCTION (ALWAYS)
  const supabase = getServiceSupabase() as any;
  const { error } = await supabase.from('idempotency_keys').update({
     response_status: status,
     response_body: responseBody as any
  }).eq('key', key);
  
  if (error) {
      logger.error('commitIdempotency Failed', { details: { error: error.message, key } });
  } else {
      logger.info('commitIdempotency Succeeded', { details: { key, status } });
  }

  // COMMENTED OUT: Dev mode in-memory fallback
  // const existing = memoryStore.get(key);
  // if (existing) {
  //   memoryStore.set(key, { ...existing, status, body: responseBody });
  // }
}
