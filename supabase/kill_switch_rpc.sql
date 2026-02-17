-- Hardening Kill Switch with Cooldown
CREATE OR REPLACE FUNCTION reset_inventory_atomic(
  p_actor_id UUID,
  p_ip_address TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_execution TIMESTAMPTZ;
BEGIN
  -- 1. Verify Actor is an Admin
  IF NOT EXISTS (SELECT 1 FROM admins WHERE id = p_actor_id) THEN
    RAISE EXCEPTION 'Access Denied: Actor is not an admin';
  END IF;

  -- 2. Anti-Abuse: Cooldown Check (60 seconds)
  -- We check audit logs for recent KILL_SWITCH_ACTIVATED
  SELECT timestamp INTO last_execution
  FROM audit_logs
  WHERE action = 'KILL_SWITCH_ACTIVATED'
  ORDER BY timestamp DESC
  LIMIT 1;

  IF last_execution IS NOT NULL AND last_execution > NOW() - INTERVAL '60 seconds' THEN
     RAISE EXCEPTION 'Rate Limit Exceeded: Kill Switch is in cooldown';
  END IF;

  -- 3. Delete all inventory
  DELETE FROM inventory;

  -- 4. Audit Log (Bypassing RLS via SECURITY DEFINER)
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
