import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { lockIdempotency } from '@/lib/idempotency';

// PRODUCTION PARITY: Hard assertions — no fallback to empty strings
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('PRODUCTION PARITY FAILURE: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for queue');
}

// Initialize Redis for Queue
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

const QUEUE_KEY = 'inventory:buy:queue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, quantity, actorId } = body;

    // 1. Idempotency Check (Prevent duplicate queuing)
    const idempotency = await lockIdempotency(req, body);
    if (!idempotency.locked) {
      return idempotency.response!;
    }

    // 2. Validate Payload
    if (!itemId || !quantity || !actorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const idempotencyKey = req.headers.get('Idempotency-Key');

    // 3A. Backpressure Check
    const queueLen = await redis.llen(QUEUE_KEY);
    if (queueLen > 10000) {
       console.warn('Queue Saturation', { reason: 'Backpressure Limit Exceeded', count: queueLen });
       return NextResponse.json(
         { error: 'System overloaded, please retry later' },
         { status: 503, headers: { 'Retry-After': '30' } }
       );
    }

    // 3. Enqueue to Redis List (or Stream)
    // We push a JSON job to the list
    const job = {
      item_id: itemId,
      quantity,
      actor_id: actorId,
      idempotency_key: idempotencyKey,
      timestamp: Date.now(),
      retry_count: 0 // Resilience: Init retry count
    };

    await redis.lpush(QUEUE_KEY, JSON.stringify(job));

    // 4. Return Accepted (202)
    // The client should poll or listen to Realtime for actual completion.
    return NextResponse.json(
      { status: 'processing', message: 'Order queued for processing' },
      { status: 202 }
    );

  } catch (err: any) {
    console.error('Queue Error:', err);
    return NextResponse.json({ error: 'System busy, please retry' }, { status: 500 });
  }
}
