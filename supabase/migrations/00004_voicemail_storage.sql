-- Create storage bucket for voicemail recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('voicemails', 'voicemails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload voicemails
CREATE POLICY "Authenticated users can upload voicemails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'voicemails');

-- Allow authenticated users to read voicemails
CREATE POLICY "Authenticated users can read voicemails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'voicemails');

-- Allow authenticated users to delete voicemails
CREATE POLICY "Authenticated users can delete voicemails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'voicemails');
