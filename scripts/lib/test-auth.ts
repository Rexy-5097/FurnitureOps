/**
 * Shared Test Authentication Module
 * 
 * Centralizes auth token management for test scripts to avoid
 * hitting Supabase's signInWithPassword rate limits (502 errors).
 * 
 * Strategy:
 * - Caches admin token in /tmp/furnitureops-test-token.json
 * - Reuses cached token if < 25 minutes old (auth-guard allows 30 min)
 * - Only calls signInWithPassword on cache miss/expiry
 * - For test-specific users, uses admin.createUser (bypasses auth rate limits)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TOKEN_CACHE_FILE = '/tmp/furnitureops-test-token.json';
const TOKEN_MAX_AGE_MS = 25 * 60 * 1000; // 25 minutes (below 30-min auth-guard limit)

interface TokenCache {
  token: string;
  userId: string;
  email: string;
  createdAt: number;
}

let _supabase: SupabaseClient | null = null;

export function getTestSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

/**
 * Get a cached admin token. Only calls signInWithPassword if cache is empty/expired.
 * Safe to call from multiple test scripts sequentially.
 */
export async function getAdminToken(): Promise<{ token: string; userId: string }> {
  // 1. Try cached token
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const raw = fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8');
      const cached: TokenCache = JSON.parse(raw);
      const age = Date.now() - cached.createdAt;

      if (age < TOKEN_MAX_AGE_MS) {
        return { token: cached.token, userId: cached.userId };
      }
      // Token expired — fall through to re-auth
    }
  } catch {
    // Cache corrupted — fall through
  }

  // 2. Fresh signIn (only when cache misses)
  const sb = getTestSupabase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: 'admin@furnitureops.com',
    password: 'password123',
  });

  if (error || !data.session) {
    throw new Error(`Admin auth failed: ${error?.message || 'no session'}`);
  }

  // 3. Cache the token
  const cache: TokenCache = {
    token: data.session.access_token,
    userId: data.user.id,
    email: data.user.email || 'admin@furnitureops.com',
    createdAt: Date.now(),
  };

  fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache));

  return { token: cache.token, userId: cache.userId };
}

/**
 * Create a temporary admin user for isolation tests (e.g., concurrency).
 * Uses admin.createUser which bypasses signInWithPassword rate limits.
 * Returns a fresh token via signInWithPassword (single call).
 */
export async function createTempAdmin(): Promise<{
  token: string;
  userId: string;
  email: string;
  cleanup: () => Promise<void>;
}> {
  const sb = getTestSupabase();
  const email = `test-admin-${Date.now()}@test.com`;
  const password = 'password123';

  // Create user via admin API (no rate limit)
  const { data: userData, error: createError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !userData.user) {
    throw new Error(`Failed to create temp admin: ${createError?.message}`);
  }

  const userId = userData.user.id;

  // Promote to admin
  const { error: adminError } = await sb.from('admins').insert({ id: userId });
  if (adminError) {
    throw new Error(`Failed to promote temp admin: ${adminError.message}`);
  }

  // Sign in (single call — acceptable since this is a new unique user)
  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    throw new Error(`Temp admin auth failed: ${authError?.message}`);
  }

  const cleanup = async () => {
    await sb.from('admins').delete().eq('id', userId);
    await sb.auth.admin.deleteUser(userId);
  };

  return {
    token: authData.session.access_token,
    userId,
    email,
    cleanup,
  };
}

/**
 * Invalidate the token cache (useful after test runs that exhaust tokens)
 */
export function invalidateTokenCache(): void {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      fs.unlinkSync(TOKEN_CACHE_FILE);
    }
  } catch {
    // Ignore
  }
}
