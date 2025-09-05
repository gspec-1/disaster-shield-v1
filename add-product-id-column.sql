-- Add product_id column to stripe_orders table
-- Run this SQL in your Supabase SQL editor

-- Add the column if it doesn't exist
ALTER TABLE stripe_orders 
ADD COLUMN IF NOT EXISTS product_id text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_orders_product_id ON stripe_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_product ON stripe_orders(customer_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_project_product ON stripe_orders(project_id, product_id);

-- Check if the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stripe_orders' 
AND column_name = 'product_id';
