-- Deduplicate existing rows (keep oldest per owner snapshot)
DELETE FROM "SavedSuggestionFavorite" AS a
USING (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId", "ownerUserId", "type", "section", "content"
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM "SavedSuggestionFavorite"
) AS d
WHERE a.id = d.id AND d.rn > 1;

-- Enforce one row per normalized snapshot per teacher within a tenant
CREATE UNIQUE INDEX "SavedSuggestionFavorite_tenantId_ownerUserId_type_section_content_key"
ON "SavedSuggestionFavorite"("tenantId", "ownerUserId", "type", "section", "content");
