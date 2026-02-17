import { logger } from './logger';

export function validateRuntimeEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    // STRICT: No silent fallbacks. App must not boot with missing credentials.
    throw new Error(`PRODUCTION PARITY FAILURE: Missing required environment variables: ${missing.join(', ')}`);
  }

  // 🛡️ Leak Prevention Check
  // Ensure Service Role Key is NOT accidentally exposed in public vars if someone messed up .env
  const publicKeys = Object.keys(process.env).filter((k) => k.startsWith('NEXT_PUBLIC_'));
  for (const key of publicKeys) {
    const value = process.env[key];
    if (value && value === process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(`CRITICAL SECURITY RISK: Service Role Key detected in public variable ${key}`);
    }
  }

  // 🛡️ JWT Secret Strength Check — STRICT: Fail if weak
  if (process.env.SUPABASE_JWT_SECRET!.length < 32) {
     throw new Error('PRODUCTION PARITY FAILURE: SUPABASE_JWT_SECRET is too weak (< 32 chars). Refusing to boot.');
  }

  logger.info('✅ Runtime Integrity Check Passed', { 
    details: { 
      checks: 'All 6 required vars present', 
      jwt: 'Secret strong' 
    } 
  });
}
