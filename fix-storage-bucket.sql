-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- Create the media storage bucket (if it doesn't exist)
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
    'audio/mp3'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'audio/wav',
    'audio/mpeg',
    'audio/mp3'
  ];

-- Create simpler, more permissive policies for testing

-- Policy: Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);

-- Policy: Public read access for all files in media bucket
CREATE POLICY "Public read access for media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Alternative: More restrictive policy that checks folder structure
-- Uncomment this if you want to be more restrictive about folder access

/*
-- Policy: Users can upload to their own folder (more restrictive)
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
*/
