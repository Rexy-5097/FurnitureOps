import { getServiceSupabase } from './supabase';
import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Validates that the request is from an authenticated admin user.
 * 
 * PRODUCTION PARITY — Defense in Depth:
 * 1. PRIMARY: Local JWT verification via Supabase JWKS (ES256 asymmetric keys)
 * 2. FALLBACK: Supabase getUser() API call (verified server-side auth)
 * 3. ALWAYS: Admin table check via Supabase service client
 * 
 * NOTE: Both verification paths are secure. The JWKS path avoids a network call
 * to Supabase Auth, while getUser() is the canonical verification. In environments
 * where JWKS fetch fails (e.g., SSL proxy issues), getUser() provides equivalent
 * security guarantees since it's a server-to-server call using the service role key.
 */

// Cache the JWKS set for performance — single instance across requests
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const JWKS = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

export async function validateAdminRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Token');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Error('Invalid Token');
  }

  let userId: string;
  let userEmail: string | undefined;
  let userRole: string | undefined;

  // 🛡️ STEP 1: Try local JWT verification via JWKS (zero-trust, no auth server call)
  let jwksVerified = false;

  if (JWKS) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${supabaseUrl}/auth/v1`,
        audience: 'authenticated',
      });

      userId = payload.sub as string;
      userEmail = payload.email as string | undefined;
      userRole = payload.role as string | undefined;

      if (!userId) {
        throw new Error('JWT missing subject (sub) claim');
      }

      // 🛡️ Token freshness check: reject tokens older than 30 minutes
      const iat = payload.iat;
      if (iat) {
        const now = Math.floor(Date.now() / 1000);
        if (now - iat > 1800) {
          throw new Error('Token too old, please re-authenticate');
        }
      }

      jwksVerified = true;
    } catch (err: any) {
      // If token is genuinely expired or invalid, fail immediately
      if (err.code === 'ERR_JWT_EXPIRED' || err.message.includes('too old')) {
        throw new Error('Invalid Token');
      }
      // JWKS fetch failure (network/SSL) — fall through to getUser()
      console.warn('JWKS verification unavailable, using getUser() fallback:', err.message);
    }
  }

  // 🛡️ STEP 2: Supabase getUser() — canonical server-side verification
  // Used when JWKS is unavailable (network/SSL) or as sole path when JWKS not configured
  if (!jwksVerified) {
    const supabase = getServiceSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth Guard Error:', error?.message);
      throw new Error('Invalid Token');
    }

    userId = user.id;
    userEmail = user.email;
    userRole = user.role;

    // 🛡️ Token freshness check via JWT decode (defense in depth)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const iat = payload.iat;
        if (iat) {
          const now = Math.floor(Date.now() / 1000);
          if (now - iat > 1800) {
            throw new Error('Token too old, please re-authenticate');
          }
        }
      }
    } catch (freshErr: any) {
      if (freshErr.message.includes('too old')) throw freshErr;
      // Decode errors are non-fatal here since getUser() already verified
    }
  }

  // 🛡️ STEP 3: Admin table verification (defense in depth — ALWAYS executed)
  const supabase = getServiceSupabase();
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userId!)
    .single();

  if (!admin) {
    throw new Error('Unauthorized: User is not an Admin');
  }

  return { id: userId!, email: userEmail, role: userRole };
}
