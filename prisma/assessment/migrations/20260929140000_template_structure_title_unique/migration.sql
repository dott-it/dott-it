-- This index is not declared in schema.prisma (expression indexes are SQL-only).
-- `prisma migrate dev` may diff the database and emit:
--   DROP INDEX "AssessmentTemplate_structure_title_key";
-- Delete that statement before applying the generated migration.
-- The index is global: AssessmentTemplate has no tenantId, so the same
-- unit + lesson + type + title conflicts across tenants on purpose.
--
-- One template per unit + lesson + type + title, ignoring case and surrounding spaces.
-- Legacy rows with a null lesson stay outside the partial index.
-- Existing copies keep their curriculum text and their assessments. Only the title
-- of the newer rows changes to a free "(Copy)" / "(Copy 2)" name so the index can be created.

DO $$
DECLARE
  rec RECORD;
  candidate TEXT;
  copy_number INT;
  title_taken BOOLEAN;
BEGIN
  FOR rec IN
    SELECT id, keep_title, unit_key, lesson_number, type_key
    FROM (
      SELECT
        id,
        FIRST_VALUE(btrim(title)) OVER (
          PARTITION BY lower(btrim("unitCode")), "lessonNumber", lower(btrim("type")), lower(btrim("title"))
          ORDER BY "createdAt" ASC, id ASC
        ) AS keep_title,
        lower(btrim("unitCode")) AS unit_key,
        "lessonNumber" AS lesson_number,
        lower(btrim("type")) AS type_key,
        ROW_NUMBER() OVER (
          PARTITION BY lower(btrim("unitCode")), "lessonNumber", lower(btrim("type")), lower(btrim("title"))
          ORDER BY "createdAt" ASC, id ASC
        ) AS rn
      FROM "AssessmentTemplate"
      WHERE "unitCode" IS NOT NULL
        AND btrim("unitCode") <> ''
        AND "lessonNumber" IS NOT NULL
    ) AS ranked
    WHERE rn > 1
    ORDER BY rn ASC, id ASC
  LOOP
    copy_number := 1;
    LOOP
      IF copy_number = 1 THEN
        candidate := rec.keep_title || ' (Copy)';
      ELSE
        candidate := rec.keep_title || ' (Copy ' || copy_number::text || ')';
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM "AssessmentTemplate"
        WHERE lower(btrim("unitCode")) = rec.unit_key
          AND "lessonNumber" = rec.lesson_number
          AND lower(btrim("type")) = rec.type_key
          AND lower(btrim(title)) = lower(btrim(candidate))
          AND id <> rec.id
      ) INTO title_taken;

      EXIT WHEN NOT title_taken;

      copy_number := copy_number + 1;
      IF copy_number > 100 THEN
        RAISE EXCEPTION 'Could not find a free title for template %', rec.id;
      END IF;
    END LOOP;

    UPDATE "AssessmentTemplate"
    SET title = candidate
    WHERE id = rec.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX "AssessmentTemplate_structure_title_key"
ON "AssessmentTemplate" (
  lower(btrim("unitCode")),
  "lessonNumber",
  lower(btrim("type")),
  lower(btrim("title"))
)
WHERE "unitCode" IS NOT NULL
  AND btrim("unitCode") <> ''
  AND "lessonNumber" IS NOT NULL;
