/*
# Create Notifications System

Creates a notifications table and related functionality for real-time updates.

## New Tables

1. **notifications** - System notifications for users
   - `id` (uuid, primary key)
   - `user_id` (uuid, references profiles) - Recipient of notification
   - `type` (text) - Type of notification (job_posted, contractor_matched, etc.)
   - `title` (text) - Notification title
   - `message` (text) - Notification content
   - `data` (jsonb) - Additional notification data
   - `read` (boolean) - Whether notification has been read
   - `created_at` (timestamptz) - When notification was created

## Security

- Row Level Security enabled
- Users can only see their own notifications
- Proper indexes for performance
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'job_posted', 
    'contractor_matched', 
    'job_accepted', 
    'job_declined', 
    'payment_received',
    'project_updated',
    'inspection_scheduled'
  )),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;