
CREATE POLICY "Check-ins are viewable" ON storage.objects FOR SELECT
  USING (bucket_id = 'check-ins');
CREATE POLICY "Users upload own check-in photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'check-ins' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own check-in photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'check-ins' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own check-in photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'check-ins' AND (storage.foldername(name))[1] = auth.uid()::text);
