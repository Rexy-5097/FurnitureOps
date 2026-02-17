-- PART A: Atomic Lock Takeover
CREATE OR REPLACE FUNCTION claim_stale_idempotency_key(p_key TEXT)
RETURNS SETOF idempotency_keys
LANGUAGE sql
AS $$
  UPDATE idempotency_keys
  SET last_updated_at = NOW(),
      created_at = NOW() -- Reset lifecycle to prevent immediate subsequent cleanup
  WHERE key = p_key
    AND response_status = 202
    AND last_updated_at < NOW() - INTERVAL '30 seconds'
  RETURNING *;
$$;

-- PART B: Atomic Mutation + Idempotency Commit Wrapper
-- This ensures the Inventory Change AND the Idempotency Commit happen or fail together.
CREATE OR REPLACE FUNCTION decrement_stock_with_idempotency(
  p_item_id UUID,
  p_quantity INTEGER,
  p_actor_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB -- Return row + status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item inventory%ROWTYPE;
  v_result JSONB;
BEGIN
  -- 1. Perform Atomic Decrement (Reusing existing logic logic inline for single-tx safety)
  -- We could call decrement_stock_atomic but we need the result to build the idempotency response
  
  -- Lock & Check
  SELECT * INTO v_item FROM inventory WHERE id = p_item_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF v_item.quantity_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  -- Update Inventory
  UPDATE inventory
  SET 
    quantity_available = quantity_available - p_quantity,
    quantity_sold = COALESCE(quantity_sold, 0) + p_quantity,
    updated_at = NOW()
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  -- Insert Audit Log
  INSERT INTO audit_logs (action, actor_id, details)
  VALUES (
    'STOCK_DECREMENT', 
    p_actor_id, 
    jsonb_build_object(
      'item_id', p_item_id, 
      'quantity', p_quantity,
      'new_stock', v_item.quantity_available
    )
  );

  -- 2. Commit Idempotency Key
  -- We update the 'processing' key to 'completed'
  v_result := to_jsonb(v_item);
  
  UPDATE idempotency_keys
  SET response_status = 200,
      response_body = v_result,
      last_updated_at = NOW()
  WHERE key = p_idempotency_key;

  RETURN v_result;
END;
$$;

-- PART C: Cleanup Strategy
-- Can be called via pg_cron or Edge Function
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW() 
    AND response_status != 202; -- Optional: Don't delete processing ones? 
                                -- Actually expires_at is created_at + 60s.
                                -- If processing takes > 60s it's probably dead anyway, 
                                -- but 'claim_stale' handles 30s takeover. 
                                -- Safe to delete hardened expired rows.
$$;
