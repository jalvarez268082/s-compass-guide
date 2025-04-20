-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dropdowns table (can be nested via parent_dropdown_id)
CREATE TABLE IF NOT EXISTS dropdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  parent_dropdown_id UUID REFERENCES dropdowns(id) ON DELETE CASCADE,
  expanded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  content_subheader TEXT NOT NULL,
  content_text TEXT NOT NULL,
  dropdown_id UUID NOT NULL REFERENCES dropdowns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Checklists policies
CREATE POLICY "Checklists are viewable by owner" ON checklists
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Checklists are editable by owner" ON checklists
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Checklists can be created by authenticated users" ON checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Checklists can be deleted by owner" ON checklists
  FOR DELETE USING (auth.uid() = user_id);

-- Dropdowns policies
CREATE POLICY "Dropdowns are viewable by checklist owner" ON dropdowns
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM checklists WHERE id = dropdowns.checklist_id)
  );
  
CREATE POLICY "Dropdowns are editable by checklist owner" ON dropdowns
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM checklists WHERE id = dropdowns.checklist_id)
  );
  
CREATE POLICY "Dropdowns can be created by checklist owner" ON dropdowns
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM checklists WHERE id = dropdowns.checklist_id)
  );
  
CREATE POLICY "Dropdowns can be deleted by checklist owner" ON dropdowns
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM checklists WHERE id = dropdowns.checklist_id)
  );

-- Tasks policies
CREATE POLICY "Tasks are viewable by dropdown owner" ON tasks
  FOR SELECT USING (
    auth.uid() IN (
      SELECT c.user_id FROM checklists c 
      JOIN dropdowns d ON c.id = d.checklist_id 
      WHERE d.id = tasks.dropdown_id
    )
  );
  
CREATE POLICY "Tasks are editable by dropdown owner" ON tasks
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT c.user_id FROM checklists c 
      JOIN dropdowns d ON c.id = d.checklist_id 
      WHERE d.id = tasks.dropdown_id
    )
  );
  
CREATE POLICY "Tasks can be created by dropdown owner" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT c.user_id FROM checklists c 
      JOIN dropdowns d ON c.id = d.checklist_id 
      WHERE d.id = tasks.dropdown_id
    )
  );
  
CREATE POLICY "Tasks can be deleted by dropdown owner" ON tasks
  FOR DELETE USING (
    auth.uid() IN (
      SELECT c.user_id FROM checklists c 
      JOIN dropdowns d ON c.id = d.checklist_id 
      WHERE d.id = tasks.dropdown_id
    )
  );

-- Insert initial admin user
INSERT INTO users (email, role)
VALUES ('admin@example.com', 'admin')
ON CONFLICT (email) DO NOTHING; 