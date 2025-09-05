/*
# Enhance media table for hybrid storage approach

This migration enhances the existing media table to support the hybrid storage approach
with better metadata tracking, user relationships, and file management capabilities.

## Changes Made

1. **Add user_id column** - Link media to users for better access control
2. **Add file_size column** - Track storage usage and analytics
3. **Add mime_type column** - Better file type handling
4. **Add filename column** - Store original filename for downloads
5. **Add updated_at column** - Track file modifications
6. **Update type constraint** - Include 'audio' for voice notes
7. **Add performance indexes** - Optimize common queries
8. **Add RLS policies** - Secure access to media records

## Benefits

- Better file metadata tracking
- User-specific access control
- Storage usage analytics
- Performance optimizations
- Enhanced security
*/

-- Add new columns to existing media table
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS filename text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS mime_type text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update the type constraint to include 'audio' for voice notes
ALTER TABLE public.media 
DROP CONSTRAINT IF EXISTS media_type_check;

ALTER TABLE public.media 
ADD CONSTRAINT media_type_check CHECK (
  type = ANY (ARRAY['photo'::text, 'video'::text, 'audio'::text])
);

-- Add NOT NULL constraints for required fields
ALTER TABLE public.media 
ALTER COLUMN filename SET NOT NULL,
ALTER COLUMN file_size SET NOT NULL,
ALTER COLUMN mime_type SET NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at);
CREATE INDEX IF NOT EXISTS idx_media_updated_at ON public.media(updated_at);
CREATE INDEX IF NOT EXISTS idx_media_storage_path ON public.media(storage_path);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_media_project_type ON public.media(project_id, type);
CREATE INDEX IF NOT EXISTS idx_media_user_project ON public.media(user_id, project_id);

-- Enable Row Level Security
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure access

-- Policy: Users can view media for projects they own
CREATE POLICY "Users can view their own project media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = media.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: Users can insert media for their own projects
CREATE POLICY "Users can insert media for their projects" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = media.project_id 
    AND p.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Policy: Users can update media for their own projects
CREATE POLICY "Users can update their own media" ON public.media
FOR UPDATE USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = media.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: Users can delete media for their own projects
CREATE POLICY "Users can delete their own media" ON public.media
FOR DELETE USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = media.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: Contractors can view media for assigned projects
CREATE POLICY "Contractors can view assigned project media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = media.project_id 
    AND p.assigned_contractor_id IN (
      SELECT id FROM contractors 
      WHERE user_id = auth.uid()
    )
  )
);

-- Create function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_media_updated_at ON public.media;
CREATE TRIGGER trigger_update_media_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.media IS 'Stores metadata for media files (photos, videos, audio) uploaded during insurance claims';
COMMENT ON COLUMN public.media.id IS 'Unique identifier for the media record';
COMMENT ON COLUMN public.media.project_id IS 'Reference to the project this media belongs to';
COMMENT ON COLUMN public.media.user_id IS 'Reference to the user who uploaded this media';
COMMENT ON COLUMN public.media.type IS 'Type of media: photo, video, or audio';
COMMENT ON COLUMN public.media.room_tag IS 'Optional room or area tag (e.g., kitchen, basement)';
COMMENT ON COLUMN public.media.storage_path IS 'Path to the file in Supabase Storage bucket';
COMMENT ON COLUMN public.media.filename IS 'Original filename of the uploaded file';
COMMENT ON COLUMN public.media.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN public.media.mime_type IS 'MIME type of the file (e.g., image/jpeg, video/mp4)';
COMMENT ON COLUMN public.media.caption IS 'Optional user-provided caption or description';
COMMENT ON COLUMN public.media.created_at IS 'Timestamp when the media record was created';
COMMENT ON COLUMN public.media.updated_at IS 'Timestamp when the media record was last updated';
