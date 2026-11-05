# OpenSciEd assessment ingest

Ingest pipeline for the Assessment Library (card 375). Schema aligned with [opensci-assess-hub](https://github.com/jesseddo/opensci-assess-hub) `IngestedUnitManifest`.

## Layout

| Path | Purpose |
|------|---------|
| `lib/library/ingest/types.ts` | Canonical TypeScript schema |
| `lib/library/ingest/load-manifest.ts` | Load `data/ingested/unit-{code}.json` |
| `lib/library/ingest/to-browse-model.ts` | Map manifest → library browse UI |
| `data/ingested/unit-8.1.json` | Gold manifest (Jess prototype, `.docx` parser) |
| `scripts/ingest/unit-registry.json` | MS unit → content-pipeline folder map |
| `scripts/ingest/extract-from-content-pipeline.py` | Extract from processed JSON |
| `scripts/ingest/ingest-all-ms-units.mjs` | Batch runner |
| `scripts/ingest/compare-manifests.mjs` | QC diff vs gold |

## content-pipeline source (updated)

Full `.docx` source lives under `data/1_data_clean/{grade}/{unit}/lesson_N/original/` on `content-pipeline` `main` (merged by @aw).

```bash
CONTENT_PIPELINE_ROOT=~/Projects/content-pipeline node scripts/ingest/ingest-all-ms-units.mjs
node scripts/ingest/generate-ingested-index.mjs   # after adding manifests
```

Uses Jess's docx parsers (`extract-te-assessment-opportunities.py`, etc.). Unit **8.1** is skipped by default (gold manifest from opensci-assess-hub).

**Current MS batch (18 units):** 17 ingested from `1_data_clean` + 8.1 gold. See `data/ingested/batch-summary.json`.

Known gap: **6.1** has only 8 lessons in `1_data_clean` (source incomplete).

## Legacy: resource_library processed JSON

Older path `data/resource_library/.../processed/` — mostly metadata only. Prefer `1_data_clean` + docx ingest.

## content-pipeline git coverage (audited Jun 2026)

Only **3 of 18** MS units have processed JSON committed in git:

| Unit | Processed files in git | TE files | Status |
|------|------------------------|----------|--------|
| 8.1 | 220 | 16 | Complete — gold from Jess `.docx` parser |
| 7.1 | 171 | 14 | Complete — ingested via pipeline adapter |
| 6.1 | 101 | 8 | **Partial** (8/~12 lessons) |
| 6.2–6.6, 7.2–7.6, 8.2–8.6 | 1 each | 0 | Only `resource_metadata.json` — **not ingestable from git** |

The remaining 15 units need raw `.docx` from Google Drive or a content-pipeline re-export before ingest.

After adding manifests, regenerate the static index (required for Next.js build — no `node:fs` in app code):

```bash
node scripts/ingest/generate-ingested-index.mjs
```

## Prerequisites

Clone [eddo-ai/content-pipeline](https://github.com/eddo-ai/content-pipeline) with **processed JSON blobs** available. A `--filter=blob:none` sparse clone only fetches blobs for paths already checked out (e.g. 8.1). For all 18 MS units:

```bash
git clone https://github.com/eddo-ai/content-pipeline.git
# or expand sparse checkout and fetch blobs:
cd content-pipeline
git sparse-checkout set "data/resource_library/Grade 6" "data/resource_library/Grade 7" "data/resource_library/Grade 8"
git checkout HEAD -- "data/resource_library/Grade 6" "data/resource_library/Grade 7" "data/resource_library/Grade 8"
```

Raw `.docx` files are **not** in git. For verbatim TE text, use Jess's `ingest-unit.mjs` on a local Drive download.

## Google Drive file index (export #377)

Maps ingest manifest paths to `driveFileId` under the OpenSciEd Curriculum Drive folder.

```bash
# Pilot one unit (requires OPENSCIED_DRIVE_ROOT_FOLDER_ID in .env)
pnpm ingest:drive-index -- --unit=8.1

# All MS units in unit-registry.json
pnpm ingest:drive-index -- --all

# Preview without writing JSON
pnpm ingest:drive-index -- --unit=8.1 --dry-run
```

Output: `data/ingested/drive-index/unit-{code}.json`

The service account must have **Viewer** access to the shared Drive folder tree (`Grade N` → unit folder).

## Commands

```bash
# Single unit from content-pipeline processed/
python3 scripts/ingest/extract-from-content-pipeline.py \
  "$CONTENT_PIPELINE_ROOT/data/resource_library/Grade 8/8.1 Contact Forces/processed" \
  /tmp/unit-8.1-pipeline.json \
  8.1 "Contact Forces" "How forces act during collisions and impacts." \
  '["MS-PS2-1","MS-PS2-2"]'

# Drive-index reingest (Grade 8 formals when 1_data_clean is not local)
pnpm ingest:grade8

# Regenerate static import index for Next.js bundle
node scripts/ingest/generate-ingested-index.mjs

# QC vs gold
node scripts/ingest/compare-manifests.mjs \
  /tmp/unit-8.1-pipeline.json \
  data/ingested/unit-8.1.json \
  docs/POC-UNIT-81-GAP-REPORT.md
```

## UI integration

`loadUnitBrowseData()` checks `data/ingested/unit-{code}.json` first. If present, browse pages use ingested TE opportunities and formal assessments. Falls back to `openscied_units.json` + `unit-overviews.js` for units not yet ingested.
