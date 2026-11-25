import { NextResponse } from 'next/server';

// Edge Runtime (INT257 Unit VI): runs on the V8 edge runtime, not Node.js.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return NextResponse.json({
    status: 'ok',
    runtime: 'edge',
    region: req.headers.get('x-vercel-ip-country') ?? 'local',
    time: new Date().toISOString(),
    env: process.env.NEXT_PUBLIC_LAB_ENV ?? 'development',
  });
}
