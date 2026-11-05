-- Align thematic-analysis FKs with product expectation: derived analysis rows
-- cascade when the parent assessment (or analysis/item) is deleted.
-- Idempotent for envs that already applied CASCADE via the create migration.

ALTER TABLE "ThematicAnalysis" DROP CONSTRAINT IF EXISTS "ThematicAnalysis_assessmentId_fkey";
ALTER TABLE "ThematicAnalysis" ADD CONSTRAINT "ThematicAnalysis_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ThematicAnalysisItem" DROP CONSTRAINT IF EXISTS "ThematicAnalysisItem_thematicAnalysisId_fkey";
ALTER TABLE "ThematicAnalysisItem" ADD CONSTRAINT "ThematicAnalysisItem_thematicAnalysisId_fkey"
  FOREIGN KEY ("thematicAnalysisId") REFERENCES "ThematicAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ThematicAnalysisCitation" DROP CONSTRAINT IF EXISTS "ThematicAnalysisCitation_itemId_fkey";
ALTER TABLE "ThematicAnalysisCitation" ADD CONSTRAINT "ThematicAnalysisCitation_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "ThematicAnalysisItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
