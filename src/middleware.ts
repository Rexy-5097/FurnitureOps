import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function applySecurityHeaders(response: NextResponse): NextResponse {
  // 🛡️ Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // 🔒 Content-Security-Policy (CSP)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );

  return response;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Extract IP safely: Prefer request.ip (Next.js), then x-real-ip, then x-forwarded-for
  let ip = request.ip ?? 'unknown';
  
  if (ip === 'unknown' || ip === '::1') {
    const xRealIp = request.headers.get('x-real-ip');
    const xForwardedFor = request.headers.get('x-forwarded-for');
    
    if (xRealIp) {
      ip = xRealIp.trim();
    } else if (xForwardedFor) {
      ip = xForwardedFor.split(',')[0].trim();
    }
  }
  const path = request.nextUrl.pathname;

  // 3️⃣ Distributed Rate Limiting (Redis-Backed) — Fail-open when Redis unreachable
  if (path.startsWith('/api/admin') || path.startsWith('/api/inventory') || path.startsWith('/api/auth')) {
    try {
      const { ratelimit } = await import('@/lib/rate-limit');
      const result = await ratelimit.limit(ip);
      
      // If Redis is unreachable (timeout), log warning but allow request through
      if ((result as any).reason === 'timeout') {
        console.warn('⚠️ Rate Limit Redis unreachable (timeout) — allowing request through');
        // Fall through — let the request proceed without rate limiting
      } else if (!result.success) {
         const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
         const res = NextResponse.json(
           { error: 'Too Many Requests - Slow Down' }, 
           { status: 429 }
         );
         res.headers.set('Retry-After', retryAfter.toString());
         res.headers.set('X-RateLimit-Limit', result.limit.toString());
         res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
         res.headers.set('X-RateLimit-Reset', result.reset.toString());
         return applySecurityHeaders(res);
      }
    } catch (err) {
      // If Redis is down, log and allow through (fail-open for dev, add strict mode for prod)
      console.warn('⚠️ Rate Limit Service Unavailable — allowing request through:', err);
    }
  }

  // 2️⃣ Edge-Level Route Protection (Admin APIs Only)
  if (path.startsWith('/api/admin')) {
    // strict method check
    if (request.method !== 'GET' && request.method !== 'POST') {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
      );
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Token verification is handled by the API route, BUT enforce session freshness at edge
    try {
        const tokenParts = authHeader.replace('Bearer ', '').split('.');
        if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const iat = payload.iat;
            const now = Math.floor(Date.now() / 1000);
            
            // 🛡️ Hardening: Admin Actions require session < 30 mins old
            if (iat && (now - iat) > 1800) { 
               return applySecurityHeaders(
                 NextResponse.json({ error: 'Session too old, please re-login' }, { status: 401 })
               );
            }
        }
    } catch (e) {
        // Ignore decode errors here, let API fail it proper.
    }
  }

  // 1️⃣ Apply Security Headers to ALL Responses (Passing through)
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
