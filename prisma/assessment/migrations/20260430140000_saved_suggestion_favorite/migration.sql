-- CreateTable
CREATE TABLE "SavedSuggestionFavorite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSuggestionFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedSuggestionFavorite_tenantId_ownerUserId_idx" ON "SavedSuggestionFavorite"("tenantId", "ownerUserId");
