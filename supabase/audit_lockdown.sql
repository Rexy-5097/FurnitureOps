-- PART A: Audit Log Protection

-- 1. Ensure RLS is permitted
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON audit_logs;
DROP POLICY IF EXISTS "Enable insert for everyone" ON audit_logs;
DROP POLICY IF EXISTS "Allow select for all" ON audit_logs;

-- 3. Policy: Only users in 'admins' table can SELECT
CREATE POLICY "Admins can view audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- 4. Revoke all modification privileges from everyone (Only Service Role/RPC can write)
REVOKE INSERT, UPDATE, DELETE ON audit_logs FROM public;
REVOKE INSERT, UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit_logs FROM anon;

-- PART B: Harden Kill Switch RPC

CREATE OR REPLACE FUNCTION reset_inventory_atomic(
  p_actor_id UUID,
  p_ip_address TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verify Actor is an Admin
  IF NOT EXISTS (SELECT 1 FROM admins WHERE id = p_actor_id) THEN
    RAISE EXCEPTION 'Access Denied: Actor is not an admin';
  END IF;

  -- 2. Delete all inventory
  DELETE FROM inventory;

  -- 3. Audit Log (Bypassing RLS via SECURITY DEFINER)
  INSERT INTO audit_logs (action, actor_id, details)
  VALUES (
    'KILL_SWITCH_ACTIVATED',
    p_actor_id,
    jsonb_build_object(
      'source', 'rpc_atomic',
      'ip_address', p_ip_address,
      'timestamp', NOW()
    )
  );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION reset_inventory_atomic(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reset_inventory_atomic(UUID, TEXT) TO authenticated;
