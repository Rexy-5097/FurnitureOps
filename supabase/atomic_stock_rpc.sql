CREATE OR REPLACE FUNCTION decrement_stock_atomic(
  p_item_id UUID,
  p_quantity INTEGER,
  p_actor_id UUID
)
RETURNS inventory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_item_name TEXT;
  v_item inventory%ROWTYPE;
BEGIN
  -- 1. Lock the row and get current state
  SELECT quantity_available, name INTO v_current_stock, v_item_name
  FROM inventory
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- 2. Check stock
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: Available %, Requested %', v_current_stock, p_quantity;
  END IF;

  -- 3. Perform Update (Decrement available, Increment sold)
  UPDATE inventory
  SET 
    quantity_available = quantity_available - p_quantity,
    quantity_sold = COALESCE(quantity_sold, 0) + p_quantity,
    updated_at = NOW()
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  -- 4. Audit Log
  INSERT INTO audit_logs (action, actor_id, details)
  VALUES (
    'STOCK_DECREMENT', 
    p_actor_id, 
    jsonb_build_object(
      'item_id', p_item_id,
      'item_name', v_item_name,
      'quantity_decremented', p_quantity,
      'previous_stock', v_current_stock,
      'new_stock', v_current_stock - p_quantity
    )
  );

  RETURN v_item;
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION decrement_stock_atomic(UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_stock_atomic(UUID, INTEGER, UUID) TO authenticated;
