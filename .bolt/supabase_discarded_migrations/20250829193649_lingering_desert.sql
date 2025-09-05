@@ .. @@
 CREATE POLICY "Contractors can update own data" ON contractors
   FOR UPDATE TO authenticated
   USING (user_id = auth.uid());
 
+CREATE POLICY "Users can create contractor profile" ON contractors
+  FOR INSERT TO authenticated
+  WITH CHECK (user_id = auth.uid());
+
 -- Projects: Users can read/update their own projects, contractors can read assigned projects