-- Atomic Batch Decrement for Queue Workers
-- Takes an array of items to decrement
-- Processing Strategy:
-- 1. Sort by Item ID (Deadlock Prevention)
-- 2. Decrement Quantity
-- 3. Log Audit
-- 4. Return Success/Fail status for each

CREATE TYPE inventory_decrement_request AS (
  item_id UUID,
  quantity INTEGER,
  actor_id UUID,
  idempotency_key TEXT
);

CREATE OR REPLACE FUNCTION decrement_stock_batch_atomic(
  p_requests inventory_decrement_request[]
)
RETURNS TABLE (
  item_id UUID,
  status TEXT, -- 'SUCCESS', 'OUT_OF_STOCK', 'IDEMPOTENCY_CONFLICT'
  new_quantity INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req inventory_decrement_request;
  current_qty INTEGER;
BEGIN
  -- Iterate through requests (Assumed sorted by caller or we sort here?)
  -- For strict deadlock safety, we should order by item_id.
  -- But PL/PGSQL iteration order depends on input array.
  -- Responsibility of Worker to sort before calling RPC.

  FOREACH req IN ARRAY p_requests
  LOOP
    -- 1. Idempotency Check (Simplified for Batch: If key exists, skip?)
    -- We assume the Worker has already deduplicated or we do a quick check?
    -- If we use the keys table, we should insert/check.
    -- To keep this RPC fast, we might rely on the Worker to handle Idempotency State
    -- OR we check it here. Let's check here for safety.
    
    IF EXISTS (SELECT 1 FROM idempotency_keys WHERE key = req.idempotency_key) THEN
        item_id := req.item_id;
        status := 'IDEMPOTENCY_CONFLICT';
        new_quantity := NULL;
        RETURN NEXT;
        CONTINUE;
    END IF;

    -- 2. Lock & Decrement
    SELECT quantity_available INTO current_qty
    FROM inventory
    WHERE id = req.item_id
    FOR UPDATE; -- Row Lock

    IF NOT FOUND THEN
       item_id := req.item_id;
       status := 'ITEM_NOT_FOUND';
       new_quantity := NULL;
       RETURN NEXT;
    ELSIF current_qty < req.quantity THEN
       item_id := req.item_id;
       status := 'OUT_OF_STOCK';
       new_quantity := current_qty;
       RETURN NEXT;
    ELSE
       -- UPDATE
       UPDATE inventory
       SET quantity_available = quantity_available - req.quantity,
           quantity_sold = quantity_sold + req.quantity
       WHERE id = req.item_id
       RETURNING quantity_available INTO new_quantity;

       -- AUDIT
       INSERT INTO audit_logs (action, actor_id, details)
       VALUES (
         'ITEM_SOLD',
         req.actor_id,
         jsonb_build_object(
           'item_id', req.item_id,
           'qty_sold', req.quantity,
           'new_qty', new_quantity,
           'source', 'batch_worker'
         )
       );

       -- IDEMPOTENCY COMMIT
       INSERT INTO idempotency_keys (key, request_hash, response_status, response_body)
       VALUES (req.idempotency_key, 'BATCH_HASH', 200, jsonb_build_object('status', 'success'));

       item_id := req.item_id;
       status := 'SUCCESS';
       RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;
