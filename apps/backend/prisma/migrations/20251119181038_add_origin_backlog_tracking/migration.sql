-- AddOriginBacklogTracking
-- This migration adds origin backlog tracking to tasks so they can display their origin color

-- Step 1: Add originBacklogId column (nullable initially for safe migration)
ALTER TABLE "tasks" ADD COLUMN "origin_backlog_id" TEXT;

-- Step 2: Backfill existing tasks with origin backlog ID
-- For existing tasks, set originBacklogId to the user's first backlog by order_index
UPDATE tasks t
SET origin_backlog_id = (
  SELECT l.id
  FROM lists l
  WHERE l.user_id = t.user_id
    AND l.is_backlog = true
  ORDER BY l.order_index ASC
  LIMIT 1
)
WHERE t.origin_backlog_id IS NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_origin_backlog_id_fkey"
  FOREIGN KEY ("origin_backlog_id")
  REFERENCES "lists"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Step 4: Add index for efficient origin backlog lookups
CREATE INDEX "tasks_user_id_origin_backlog_id_idx" ON "tasks"("user_id", "origin_backlog_id");
