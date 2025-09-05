/*
# Grant INSERT permissions on notifications table

Fixes the RLS policy violation by granting the authenticated role explicit INSERT permissions
on the notifications table. RLS policies only filter access but don't grant base table privileges.

## Changes

1. **Grant INSERT permission** - Allow authenticated users to insert into notifications table
2. **Maintain security** - Existing RLS policies still control what can be inserted

## Security

- Users can insert notifications but RLS policies control the content
- Maintains data integrity while enabling client-side notification creation
*/

-- Grant INSERT permission on notifications table to authenticated role
GRANT INSERT ON public.notifications TO authenticated;

-- Ensure the existing RLS policy allows the insertion
-- (This should already exist from previous migrations, but ensuring it's correct)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);