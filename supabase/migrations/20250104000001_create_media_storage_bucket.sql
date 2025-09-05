/*
# Create media storage bucket

This migration creates a Supabase storage bucket for media files
(photos, videos, and voice notes) uploaded during the insurance claim process.

## Storage Bucket Configuration

- **Bucket Name**: `media`
- **Public Access**: Yes (for easy access to uploaded files)
- **File Size Limit**: 10MB per file
- **Allowed MIME Types**: Images, videos, and audio files

## Security Policies

- Users can only upload files to their own folder (`media/{user_id}/`)
- Users can view files they uploaded
- Public read access for viewing uploaded media
*/

-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'audio/wav',
    'audio/mpeg',
    'audio/mp4'
  ]
);

-- Create RLS policies for the media bucket

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update files in their own folder
CREATE POLICY "Users can update files in their own folder" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete files from their own folder
CREATE POLICY "Users can delete files from their own folder" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Public read access for all files in media bucket
CREATE POLICY "Public read access for media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Policy: Users can view files they uploaded
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
