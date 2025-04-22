-- Add upsert policy for dropdowns
CREATE POLICY "Dropdowns can be upserted by checklist owner" ON dropdowns
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM checklists WHERE id = dropdowns.checklist_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM checklists WHERE id = dropdowns.checklist_id)
  );
  
-- Add upsert policy for tasks  
CREATE POLICY "Tasks can be upserted by dropdown owner" ON tasks
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT c.user_id FROM checklists c 
      JOIN dropdowns d ON c.id = d.checklist_id 
      WHERE d.id = tasks.dropdown_id
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT c.user_id FROM checklists c 
      JOIN dropdowns d ON c.id = d.checklist_id 
      WHERE d.id = tasks.dropdown_id
    )
  ); 