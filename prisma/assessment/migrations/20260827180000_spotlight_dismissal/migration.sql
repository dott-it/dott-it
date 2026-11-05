-- Spotlight dismissals: once a teacher dismisses a card for an assessment, it never returns.

CREATE TABLE IF NOT EXISTS "SpotlightDismissal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotlightDismissal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SpotlightDismissal_teacherId_assessmentId_key"
  ON "SpotlightDismissal"("teacherId", "assessmentId");

CREATE INDEX IF NOT EXISTS "SpotlightDismissal_teacherId_idx"
  ON "SpotlightDismissal"("teacherId");

CREATE INDEX IF NOT EXISTS "SpotlightDismissal_assessmentId_idx"
  ON "SpotlightDismissal"("assessmentId");

DO $$ BEGIN
    ALTER TABLE "SpotlightDismissal"
      ADD CONSTRAINT "SpotlightDismissal_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
