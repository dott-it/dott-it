-- Allow each teacher in a tenant to attach the same library Form to their own Workspace list.
-- Idempotency is per (tenant, teacher, form), not tenant-wide.
DROP INDEX IF EXISTS "Assessment_tenantId_googleFormId_key";

CREATE UNIQUE INDEX "Assessment_tenantId_teacherId_googleFormId_key"
ON "Assessment"("tenantId", "teacherId", "googleFormId");
