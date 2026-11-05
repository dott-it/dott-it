-- Idempotent: tables may already exist from prisma db push in some environments.

CREATE TABLE IF NOT EXISTS "ThematicAnalysis" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responsesCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThematicAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThematicAnalysisItem" (
    "id" TEXT NOT NULL,
    "thematicAnalysisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ThematicAnalysisItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThematicAnalysisCitation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "learnerName" TEXT NOT NULL,
    "highlights" TEXT[],
    "annotation" TEXT NOT NULL,

    CONSTRAINT "ThematicAnalysisCitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ThematicAnalysis_assessmentId_idx" ON "ThematicAnalysis"("assessmentId");

DO $$ BEGIN
    ALTER TABLE "ThematicAnalysis" ADD CONSTRAINT "ThematicAnalysis_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ThematicAnalysisItem" ADD CONSTRAINT "ThematicAnalysisItem_thematicAnalysisId_fkey" FOREIGN KEY ("thematicAnalysisId") REFERENCES "ThematicAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ThematicAnalysisCitation" ADD CONSTRAINT "ThematicAnalysisCitation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ThematicAnalysisItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
