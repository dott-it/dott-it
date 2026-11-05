-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TEXT NOT NULL,
    "dueAt" TEXT NOT NULL,
    "assignedTo" JSONB NOT NULL,
    "submissionUrl" TEXT,
    "googleFormId" TEXT,
    "status" TEXT NOT NULL,
    "instructions" TEXT,
    "numberOfQuestions" INTEGER NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentEvent" (
    "id" TEXT NOT NULL,
    "assessmentRecordId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userType" TEXT,

    CONSTRAINT "AssessmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "classSection" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "rawAnswer" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "rubricScore" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "teacherScore" TEXT NOT NULL,
    "numberOfQuestions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "gradeLevel" TEXT,
    "unitCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "assessmentRecordId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackSection" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT,
    "type" TEXT NOT NULL,
    "originalSectionId" TEXT,
    "used" BOOLEAN,
    "discarted" BOOLEAN,
    "isCustomized" BOOLEAN,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "aiSuggestionsId" TEXT,

    CONSTRAINT "FeedbackSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricEvaluation" (
    "id" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "evaluation" TEXT NOT NULL,
    "points" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "aiSuggestionsId" TEXT NOT NULL,

    CONSTRAINT "RubricEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "aiSuggestions" (
    "id" TEXT NOT NULL,
    "studentAnswerId" TEXT NOT NULL,
    "rubricScore" TEXT NOT NULL,
    "used" BOOLEAN,
    "discarted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aiSuggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studentAnswer" (
    "id" TEXT NOT NULL,
    "assessmentRecordId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "formSubmissionID" TEXT NOT NULL,
    "fullAiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_tenantId_idx" ON "Assessment"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "AssessmentEvent_assessmentRecordId_idx" ON "AssessmentEvent"("assessmentRecordId" ASC);

-- CreateIndex
CREATE INDEX "AssessmentEvent_eventType_idx" ON "AssessmentEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "AssessmentRecord_assessmentId_idx" ON "AssessmentRecord"("assessmentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRecord_assessmentId_learnerId_key" ON "AssessmentRecord"("assessmentId" ASC, "learnerId" ASC);

-- CreateIndex
CREATE INDEX "AssessmentRecord_tenantId_idx" ON "AssessmentRecord"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "AssessmentTemplate_id_idx" ON "AssessmentTemplate"("id" ASC);

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Event_name_idx" ON "Event"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_correlationId_key" ON "User"("correlationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier" ASC, "token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token" ASC);

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentEvent" ADD CONSTRAINT "AssessmentEvent_assessmentRecordId_fkey" FOREIGN KEY ("assessmentRecordId") REFERENCES "AssessmentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRecord" ADD CONSTRAINT "AssessmentRecord_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_assessmentRecordId_fkey" FOREIGN KEY ("assessmentRecordId") REFERENCES "AssessmentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSection" ADD CONSTRAINT "FeedbackSection_aiSuggestionsId_fkey" FOREIGN KEY ("aiSuggestionsId") REFERENCES "aiSuggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSection" ADD CONSTRAINT "FeedbackSection_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricEvaluation" ADD CONSTRAINT "RubricEvaluation_aiSuggestionsId_fkey" FOREIGN KEY ("aiSuggestionsId") REFERENCES "aiSuggestions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aiSuggestions" ADD CONSTRAINT "aiSuggestions_studentAnswerId_fkey" FOREIGN KEY ("studentAnswerId") REFERENCES "studentAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studentAnswer" ADD CONSTRAINT "studentAnswer_assessmentRecordId_fkey" FOREIGN KEY ("assessmentRecordId") REFERENCES "AssessmentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
