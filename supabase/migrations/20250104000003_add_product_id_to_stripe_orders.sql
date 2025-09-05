/*
# Add product_id to stripe_orders table

This migration adds the product_id column to the stripe_orders table
to properly track which product was purchased in each order.

## Changes

1. **Add product_id column** - Links orders to specific products
2. **Add index** - Improves query performance for product-based lookups

## Security

- Text field to store product identifiers (SECURITY_DEPOSIT, DISASTERSHIELD_SERVICE_FEE, etc.)
*/

-- Add product_id column to stripe_orders table
ALTER TABLE stripe_orders 
ADD COLUMN IF NOT EXISTS product_id text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_orders_product_id ON stripe_orders(product_id);

-- Add index for combined queries
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_product ON stripe_orders(customer_id, product_id);

-- Add index for project and product combined queries
CREATE INDEX IF NOT EXISTS idx_stripe_orders_project_product ON stripe_orders(project_id, product_id);
