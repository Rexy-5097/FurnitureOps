# Troubleshooting Google Login Error

## Issue

When attempting to login with Google, you are redirected to `https://furniture-ops.vercel.apphttp` (notice the extra `http` at the end), resulting in a `DNS_PROBE_FINISHED_NXDOMAIN` error.

## Root Cause

This is a configuration issue in your Supabase Project Settings. The **Site URL** or one of the **Redirect URLs** has a typo.

Because `http://localhost:3000` is likely not in your Allowed Redirect URLs list, Supabase is falling back to your default Site URL, which contains the typo.

## Solution

### Step 1: Fix the Typo in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (`FurnitureOps`).
3. Navigate to **Authentication** > **URL Configuration**.
4. Look at the **Site URL** field.
   - ❌ Incorrect: `https://furniture-ops.vercel.apphttp`
   - ✅ Correct: `https://furniture-ops.vercel.app`
5. Remove the trailing `http` and click **Save**.

### Step 2: Whitelist Localhost

To ensure Google Login works locally:

1. In the same **URL Configuration** section, look at **Redirect URLs**.
2. Click **Add URL**.
3. Add `http://localhost:3000/**` (or just `http://localhost:3000`).
4. Click **Save**.

### Step 3: Verify

1. Restart your local server if needed (though not strictly necessary for Supabase config changes).
2. Go to `http://localhost:3000/login`.
3. Try "Sign in with Google" again.
4. You should now be redirected back to `http://localhost:3000/dashboard`.
