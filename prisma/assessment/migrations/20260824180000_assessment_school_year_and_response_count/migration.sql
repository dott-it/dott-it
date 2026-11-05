-- Add school year, unit code, and denormalized student response count to Assessment.

ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "schoolYear" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "unitCode" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "studentResponsesCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill schoolYear from assignedAt (fallback dueAt) using Jul 1 – Jun 30 rule in UTC
-- (matches lib/school-year.ts getSchoolYearForDate).
UPDATE "Assessment" AS a
SET "schoolYear" = sub.computed_year
FROM (
  SELECT
    id,
    CASE
      WHEN EXTRACT(MONTH FROM ref_date AT TIME ZONE 'UTC') >= 7 THEN
        (EXTRACT(YEAR FROM ref_date AT TIME ZONE 'UTC')::int)::text
        || '-'
        || (EXTRACT(YEAR FROM ref_date AT TIME ZONE 'UTC')::int + 1)::text
      ELSE
        (EXTRACT(YEAR FROM ref_date AT TIME ZONE 'UTC')::int - 1)::text
        || '-'
        || (EXTRACT(YEAR FROM ref_date AT TIME ZONE 'UTC')::int)::text
    END AS computed_year
  FROM (
    SELECT
      id,
      COALESCE(
        CASE
          WHEN "assignedAt" ~ '^\d{4}-\d{2}-\d{2}' THEN "assignedAt"::timestamptz
          ELSE NULL
        END,
        CASE
          WHEN "dueAt" ~ '^\d{4}-\d{2}-\d{2}' THEN "dueAt"::timestamptz
          ELSE NULL
        END,
        CURRENT_TIMESTAMP
      ) AS ref_date
    FROM "Assessment"
  ) dated
) AS sub
WHERE a.id = sub.id
  AND (a."schoolYear" IS NULL OR btrim(a."schoolYear") = '');

-- Backfill unitCode from template when assessment has none.
UPDATE "Assessment" AS a
SET "unitCode" = t."unitCode"
FROM "AssessmentTemplate" AS t
WHERE a."templateId" = t.id
  AND (a."unitCode" IS NULL OR btrim(a."unitCode") = '')
  AND t."unitCode" IS NOT NULL
  AND btrim(t."unitCode") <> '';

-- Backfill studentResponsesCount = records with at least one studentAnswer.
UPDATE "Assessment" AS a
SET "studentResponsesCount" = COALESCE(counts.cnt, 0)
FROM (
  SELECT
    ar."assessmentId",
    COUNT(DISTINCT ar.id)::int AS cnt
  FROM "AssessmentRecord" ar
  INNER JOIN "studentAnswer" sa ON sa."assessmentRecordId" = ar.id
  GROUP BY ar."assessmentId"
) AS counts
WHERE a.id = counts."assessmentId";

-- Ensure every row has a schoolYear before NOT NULL (UTC, matches JS helpers).
UPDATE "Assessment"
SET "schoolYear" = CASE
  WHEN EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') >= 7 THEN
    (EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::int)::text
    || '-'
    || (EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::int + 1)::text
  ELSE
    (EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::int - 1)::text
    || '-'
    || (EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::int)::text
END
WHERE "schoolYear" IS NULL OR btrim("schoolYear") = '';

ALTER TABLE "Assessment" ALTER COLUMN "schoolYear" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Assessment_teacherId_schoolYear_idx"
  ON "Assessment"("teacherId", "schoolYear");

CREATE INDEX IF NOT EXISTS "Assessment_tenantId_schoolYear_idx"
  ON "Assessment"("tenantId", "schoolYear");
