-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "teacherId" SET DEFAULT '',
ALTER COLUMN "numberOfQuestions" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "AssessmentRecord" ALTER COLUMN "classSection" SET DEFAULT '',
ALTER COLUMN "rubricScore" DROP NOT NULL,
ALTER COLUMN "rubricScore" SET DEFAULT '',
ALTER COLUMN "details" SET DEFAULT '',
ALTER COLUMN "type" SET DEFAULT 'General',
ALTER COLUMN "teacherScore" DROP NOT NULL,
ALTER COLUMN "teacherScore" SET DEFAULT '',
ALTER COLUMN "numberOfQuestions" SET DEFAULT '0',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AssessmentTemplate" ALTER COLUMN "type" SET DEFAULT 'General';

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "UserReference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReference_correlationId_key" ON "UserReference"("correlationId");
