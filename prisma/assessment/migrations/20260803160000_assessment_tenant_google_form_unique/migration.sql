-- Drop duplicate tenant+form attachments that have no student records (keep oldest)
DELETE FROM "Assessment" AS a
USING (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId", "googleFormId"
      ORDER BY id ASC
    ) AS rn
  FROM "Assessment"
  WHERE "googleFormId" IS NOT NULL
) AS d
WHERE a.id = d.id
  AND d.rn > 1
  AND NOT EXISTS (
    SELECT 1 FROM "AssessmentRecord" ar WHERE ar."assessmentId" = a.id
  );

-- Remaining duplicates still have AssessmentRecord rows. Clearing googleFormId on the
-- newer copies preserves student data and lets the unique index apply. Keep the oldest.
UPDATE "Assessment" AS a
SET "googleFormId" = NULL
FROM (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId", "googleFormId"
      ORDER BY id ASC
    ) AS rn
  FROM "Assessment"
  WHERE "googleFormId" IS NOT NULL
) AS d
WHERE a.id = d.id
  AND d.rn > 1;

-- Enforce idempotent Workspace attach for the same Form within a tenant
-- (PostgreSQL allows multiple NULLs in googleFormId)
CREATE UNIQUE INDEX "Assessment_tenantId_googleFormId_key"
ON "Assessment"("tenantId", "googleFormId");
