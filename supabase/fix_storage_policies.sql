-- Ensure storage objects table has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts during re-run)
DROP POLICY IF EXISTS "storage_upload_admin" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;

-- STEP 2 — FIX STORAGE POLICY (CRITICAL)
-- Create a secure INSERT policy for Storage:
-- - User must be authenticated
-- - User must exist in "admins" table
-- STEP 6 — OPTIONAL HARDENING (Restrict file types)
CREATE POLICY "Admins can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'furniture-images'
  AND EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
  AND (storage.extension(name) IN ('png', 'jpg', 'jpeg'))
);

-- STEP 3 — ALLOW READ ACCESS (SAFE)
CREATE POLICY "Authenticated users can view images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'furniture-images');
