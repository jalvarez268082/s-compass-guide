-- Add position column to dropdowns table
ALTER TABLE dropdowns ADD COLUMN position INTEGER DEFAULT 0;

-- Add position column to tasks table
ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0;

-- Update existing dropdowns to have unique positions within their parent context
-- Root level dropdowns (no parent)
WITH ranked_dropdowns AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY checklist_id, parent_dropdown_id ORDER BY created_at) - 1 as new_position
  FROM dropdowns
  WHERE parent_dropdown_id IS NULL
)
UPDATE dropdowns
SET position = ranked_dropdowns.new_position
FROM ranked_dropdowns
WHERE dropdowns.id = ranked_dropdowns.id;

-- Nested dropdowns
WITH ranked_nested_dropdowns AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY parent_dropdown_id ORDER BY created_at) - 1 as new_position
  FROM dropdowns
  WHERE parent_dropdown_id IS NOT NULL
)
UPDATE dropdowns
SET position = ranked_nested_dropdowns.new_position
FROM ranked_nested_dropdowns
WHERE dropdowns.id = ranked_nested_dropdowns.id;

-- Update existing tasks to have unique positions within their dropdown
WITH ranked_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY dropdown_id ORDER BY created_at) - 1 as new_position
  FROM tasks
)
UPDATE tasks
SET position = ranked_tasks.new_position
FROM ranked_tasks
WHERE tasks.id = ranked_tasks.id; 