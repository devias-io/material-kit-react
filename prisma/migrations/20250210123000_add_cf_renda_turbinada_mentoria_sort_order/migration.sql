-- Add sort order column to mentorias to support manual reordering
ALTER TABLE "mentorias" ADD COLUMN "sort_order" INTEGER;

-- Initialize existing mentorias with an explicit order based on current schedule
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY COALESCE(release_date, recorded_at) DESC, id DESC) AS position
  FROM "mentorias"
)
UPDATE "mentorias" AS m
SET "sort_order" = o.position
FROM ordered AS o
WHERE m.id = o.id;

-- Index to speed up ordering queries for mentorias
CREATE INDEX IF NOT EXISTS "mentorias_sort_order_idx"
  ON "mentorias" ("sort_order" ASC, "release_date" DESC, "recorded_at" DESC);
