# POC Unit 8.1 — Gap Report (content-pipeline vs opensci-assess-hub)

Generated: 2026-06-26T17:47:09.000Z

## Sources

- **Pipeline POC:** historically `data/ingest-poc/unit-8.1-from-pipeline.json` (removed from the delivery branch; regenerate offline if needed — compare via `scripts/ingest/compare-manifests.mjs`)
- **Gold standard:** `/home/ocarlosfelix/Projects/opensci-assess-hub/src/data/ingested/unit-8.1.json` (Jess prototype)
- **content-pipeline path:** `/home/ocarlosfelix/Projects/content-pipeline/data/resource_library/Grade 8/8.1 Contact Forces/processed`

## Executive summary

| Metric | Pipeline POC | Gold (Jess) | Delta |
|--------|-------------|-------------|-------|
| Total library rows | 46 | 44 | 2 |
| TE opportunities | 41 | 36 | 5 |
| Formal assessments | 5 | 8 | -3 |
| Lessons | 16 | 16 | — |

## Key finding: raw `.docx` not in git

The `content-pipeline` repo stores **processed JSON only** under `raw/` (folder metadata). Original `.docx` binaries are not versioned. Jess's ingest scripts expect local `.docx` files. This POC uses a **regex adapter** on `page_content`, which differs from paragraph-based `.docx` parsing.

## TE opportunities by lesson

| Lesson | Pipeline | Gold | Delta |
|--------|----------|------|-------|
| 1 | 2 | 2 | +0 |
| 2 | 3 | 3 | +0 |
| 3 | 1 | 1 | +0 |
| 4 | 3 | 3 | +0 |
| 5 | 3 | 2 | +1 ⚠️ |
| 6 | 2 | 2 | +0 |
| 7 | 2 | 2 | +0 |
| 8 | 1 | 0 | +1 ⚠️ |
| 9 | 5 | 4 | +1 ⚠️ |
| 10 | 4 | 4 | +0 |
| 11 | 2 | 2 | +0 |
| 12 | 2 | 2 | +0 |
| 13 | 3 | 3 | +0 |
| 14 | 2 | 1 | +1 ⚠️ |
| 15 | 4 | 4 | +0 |
| 16 | 2 | 1 | +1 ⚠️ |

## Field coverage (TE opportunities)

| Field | Pipeline filled | Gold filled |
|-------|-----------------|-------------|
| `buildingTowards` | 32/41 | 32/36 |
| `lookListenFor` | 32/41 | 32/36 |
| `whatToDo` | 35/41 | 32/36 |
| `peCode` | 31/41 | 31/36 |
| `shortTitle` | 41/41 | 36/36 |

## ID mismatches (TE opportunities)

- **Missing in pipeline (0):** none
- **Extra in pipeline (5):** 81-5-ao-3, 81-8-ao-1, 81-9-ao-5, 81-14-ao-1, 81-16-ao-2

## Formal assessments

**Gold:**
- 10: Baseball Assessment 1
- 10: Baseball Assessment 2
- 14: Stakeholder Feedback Form
- 15: Cheerleading Performance Task (Part 1)
- 15: Cheerleading Performance Task (Part 2)
- 6: Soccer Assessment
- 7: Looking Back — Explaining Collisions
- 8: Modeling Other Force Interactions

**Pipeline:**
- 10: Baseball Assessment 1
- 10: Baseball Assessment 2
- 15: Part 1 Cheerleading
- 15: Part 2 Cheerleading
- 6: Soccer Assessment

## Formal assessment gaps (detail)

Jess's ingest treats some **handouts** as formal assessments (not files named `Assessment`). Our POC only scans `*Assessment*` filenames, so these are missing:

| Lesson | Gold title | Present in content-pipeline processed? |
|--------|-----------|----------------------------------------|
| 7 | Looking Back — Explaining Collisions | Yes (`Handout Looking back…`) |
| 8 | Modeling Other Force Interactions | Yes (`Handout Modeling other force…`) |
| 14 | Stakeholder Feedback Form | Yes (`Handout Stakeholder Feedback Form…`) |

Cheerleading Part 1/2 **are** in the pipeline but with different display titles (`Part 1 Cheerleading` vs `Cheerleading Performance Task (Part 1)`).

## content-pipeline middle school coverage

All **18 middle school units** (grades 6–8) are present in `data/resource_library/` with the same `raw/` + `processed/` layout as 8.1. The repo processed ~5,616 files successfully (Dec 2024). **Raw `.docx` binaries are not in git** — only `folder_metadata.json` + processed JSON.

## Verdict

**content-pipeline is viable as primary source** for middle school assessment library ingest, with caveats:

- Processed `page_content` is usable but needs Jess's dedup rules (handout-as-assessment, inline AO boundaries).
- For verbatim TE facilitation text, prefer running Jess's `.docx` parser against Drive-downloaded units or restoring raw exports to the pipeline.
- Expected QC delta on 8.1: ~36 TE opportunities, ~8 formal rows after full ruleset.

## Gaps & recommendations

1. **Obtain raw `.docx`** from Google Drive sync or export pipeline — required for verbatim Jess parser.
2. **Port Jess's `EXTRA_HANDOUT_ASSESSMENTS` rules** — 3 formal rows missing in POC.
3. **Apply dedup logic** — 5 extra TE rows from inline `ASSESSMENT OPPORTUNITY` false positives.
4. **Port Jess scripts** (`ingest-unit.mjs`, `extract-te-assessment-opportunities.py`) into `dott-it-workspace/scripts/ingest/`.
5. **Adopt `IngestedUnitManifest` schema** from `opensci-assess-hub/src/lib/ingest-manifest.ts`.
6. **Batch all 18 MS units** after 8.1 QC passes.
7. **Learning Commons** as tertiary source for gaps only.

## Next steps for card 375

- [ ] Share this report with @aw and @Jess on Slack
- [ ] Confirm whether content-pipeline `raw/` docx can be published or fetched from Drive
- [ ] Lock canonical schema in `lib/library/ingest/types.ts`
- [ ] Wire `load-unit-browse.ts` to ingested manifests
