-- Check current stripe_orders table structure and data
-- Run this SQL in your Supabase SQL editor

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stripe_orders' 
ORDER BY ordinal_position;

-- Check current data
SELECT 
  id,
  checkout_session_id,
  payment_intent_id,
  customer_id,
  project_id,
  product_id,
  amount_subtotal,
  amount_total,
  currency,
  payment_status,
  status,
  created_at
FROM stripe_orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any orders for the specific project
SELECT 
  id,
  checkout_session_id,
  customer_id,
  project_id,
  product_id,
  amount_total,
  status
FROM stripe_orders 
WHERE project_id = '15359147-fd54-44a8-a742-0e79f8a66b3c'
ORDER BY created_at DESC;
