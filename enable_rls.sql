-- Enable RLS for all tables - Run in Supabase SQL Editor

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_admin(uid uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role IN ('admin','superadmin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_editor(uid uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role IN ('admin','superadmin','editor'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles: all read, own insert/update, admin update all
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));

-- subjects: all read, admin write
CREATE POLICY "subjects_read" ON subjects FOR SELECT USING (true);
CREATE POLICY "subjects_write" ON subjects FOR ALL USING (is_admin(auth.uid()));

-- questions: authenticated read, editor write, admin delete
CREATE POLICY "questions_read" ON questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "questions_write" ON questions FOR INSERT WITH CHECK (is_editor(auth.uid()));
CREATE POLICY "questions_edit" ON questions FOR UPDATE USING (is_editor(auth.uid()));
CREATE POLICY "questions_del" ON questions FOR DELETE USING (is_admin(auth.uid()));

-- edit_requests: own + editor read, own insert, admin update
CREATE POLICY "editreq_read" ON edit_requests FOR SELECT USING (auth.uid() = user_id OR is_editor(auth.uid()));
CREATE POLICY "editreq_insert" ON edit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editreq_update" ON edit_requests FOR UPDATE USING (is_admin(auth.uid()));

-- question_history & admin_logs: editor/admin only
CREATE POLICY "history_all" ON question_history FOR ALL USING (is_editor(auth.uid()));
CREATE POLICY "logs_all" ON admin_logs FOR ALL USING (is_admin(auth.uid()));

-- Trash bin for deleted questions
CREATE TABLE IF NOT EXISTS deleted_questions (
  id bigint PRIMARY KEY,
  original_data jsonb NOT NULL,
  deleted_at timestamptz DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id),
  deleted_by_email text
);

ALTER TABLE deleted_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trash_all" ON deleted_questions FOR ALL USING (is_admin(auth.uid()));
