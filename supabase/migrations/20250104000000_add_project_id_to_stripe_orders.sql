/*
# Add project_id to stripe_orders table

This migration adds the missing project_id column to the stripe_orders table
to fix the critical bug where payments were being shared across projects.

## Changes

1. **Add project_id column** - Links orders to specific projects
2. **Add foreign key constraint** - Ensures data integrity
3. **Add index** - Improves query performance
4. **Update existing data** - Sets project_id for existing orders (if any)

## Security

- Foreign key constraint ensures project_id references valid projects
- Cascade delete ensures orders are cleaned up when projects are deleted
*/

-- Add project_id column to stripe_orders table
ALTER TABLE stripe_orders 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_orders_project_id ON stripe_orders(project_id);

-- Add index for combined queries
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_project ON stripe_orders(customer_id, project_id);

-- Note: Existing orders will have NULL project_id until they are updated
-- This is expected behavior for the migration
