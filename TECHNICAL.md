# Dott.it — Technical

> Engineering scope and constraints. Product strategy lives in `STRATEGY.md`.
> Updated: 2026-11-05

## Identity (engineering)

| Item | Value |
|---|---|
| Product display name | Dott.it |
| Tagline (DOTT) | Digital Organization Tool for Teachers |
| GitHub org / repo | `dott-it/dott-it` |
| Brand | Orange-led palette (Eddo was green); remove all `eddolearning.com` references |
| Source codebase | Eddo workspace (`eddo-workspace`) — reuse logic/assets; **no** legacy DB / student PII |

## Product shape (v1 engineering scope)

Pilot-sized build (~5 teacher accounts), free-tier stack only.

### In

1. **Per-teacher Google OAuth** + one-click **Classroom import** of classes/students. Manual create is fallback only.
2. **Planner timeline per class:** Unit → Lessons → linked Assessment, pre-filled from curriculum data (§ OpenSciEd), editable.
3. **Create Google Form from a lesson (~2 clicks):** Form is created in the **teacher’s** Google account (Forms API + their token); responses sync back. In-app form builder = v2.
4. **Assessment / feedback layer (no AI):** synced responses by class/lesson; manual feedback with saved snippets; export. Reuse Dott.it’s strongest existing pieces.
5. **Rebrand in code:** Dott.it naming, orange primary token(s), new logo assets, strip Dott.it domains/branding.

### Out (parked in codebase, not deleted)

- AI feedback generation
- Thematic analysis / Spotlight (and the old 15-minute cron)
- Digitize-a-form pipeline (Playwright + AI + Drive) — too heavy for free serverless
- Full multi-tenant backoffice UI (pilot onboard via script)
- Intercom
- Library export to teacher Drive until per-teacher OAuth covers it

## Engineering principles (ship gate)

1. Never ask the teacher to type what already exists elsewhere (Classroom is SoR for rosters).
2. No blank-page setup flows — open → classes / this week / unit already laid out.
3. One primary action per screen (inbox “today / this week”, not a chart dashboard).
4. Classroom → app one-way sync in v1 (no bidirectional).
5. Every feature must remove work from the teacher’s day; if it adds org work, it does not ship.

## OpenSciEd (data / planner backbone)

Reuse from Dott.it as-is:

- Ingested units grades 6–8: `data/ingested/unit-6.1.json` … `unit-8.6.json`
- Seed catalog: `data/seed/openscied_units.json` (code, title, driving question, NGSS, lesson counts, duration)
- `AssessmentTemplate` per unit/lesson (rubrics, teacher edition, answer keys)
- Library browse: grade → unit → assessments/opportunities

Behavior:

- Teacher selects e.g. OpenSciEd 7.3 → planner builds term timeline with lessons + assessments attached.
- Form creation starts from that unit’s assessment template.
- Non-OpenSciEd path: same unit/lesson skeleton, empty-but-templated.
- Treat OpenSciEd as **content/structure**, not product branding. Honor OpenSciEd license/attribution when redistributing templates.

## Google integration

**Model:** per-teacher OAuth only.

- Do **not** carry Dott.it’s Workspace path (service account + domain-wide delegation / impersonation of a shared forms mailbox). That dependency must not exist in Dott.it.
- App uses the teacher’s token to: read Classroom courses/rosters, create Forms in their Drive, read Form responses.
- Request scopes incrementally (Classroom read first; Forms/Drive when creating a Form).
- Students continue answering in Google Forms.

## Infrastructure (free-tier pilot)

| Layer | Choice | Cost |
|---|---|---|
| Hosting | Vercel Hobby (`*.vercel.app`) | $0 |
| Database | One Neon Free project; two logical DBs (assessment + user Prisma schemas) | $0 |
| Code / CI | Private GitHub `dott-it/dott-it` | $0 |
| Auth | NextAuth — credentials + Google OAuth (own GCP project) | $0 |
| Files / Forms | Teacher Google Drive via OAuth | $0 |
| AI | Off in v1 | $0 |

### Free-tier constraints that shape code

- Vercel Hobby cron ≤ 1/day → no 15-min thematic cron.
- Hobby function duration ≈ 60s → response sync **chunked per class**; rework routes that assumed `maxDuration = 300`.
- Neon Free ≈ 0.5 GB, sleeps when idle (cold start). Pilot estimate: 5 teachers × 30 students × 20 assessments ≈ 3k records — fine on storage.
- Hobby is non-commercial; paid upgrades (Vercel Pro → custom domain → Neon) are a **business** trigger — see `STRATEGY.md`.

## Reuse from Dott.it (code)

- Auth (NextAuth, credentials + Google), User/Teacher/Learner/Tenant — `prisma/user/schema.prisma`
- AssessmentTemplate / Assessment / AssessmentRecord / Feedback / FeedbackSection / saved snippets — `prisma/assessment/schema.prisma`
- Google Forms response sync (rework to per-teacher tokens), feedback UI, export utilities
- OpenSciEd ingested data + library structure
- Recent feedback/export/sync fixes from Dott.it’s final PRs

Everything else stays parked behind the ship gate above.

## Bootstrap (2026-11-05)

Repo started as a near-full copy of `dott-it-workspace` into `dott-it/dott-it`.

**Included:** app/components/lib, dual Prisma schemas + migrations (user + assessment, multi-tenant), OpenSciEd JSON under `data/`, unit/e2e test sources, Playwright configs (local use).

**Excluded:**

- Live DB dumps and Dott.it seed scripts (`scripts/seeds/`, response CSVs) — databases start empty
- Secrets (`.env*`, Google credentials)
- GCP/GKE/Azure deploy (`Dockerfile`, `cloudbuild.yaml`, `skaffold.yaml`, `infra/`, old deploy workflows)
- `node_modules` / build artifacts

**Brand:** `--primary` / `--sidebar-primary` set to orange HSL `24 95% 53%` in `styles/globals.css` (Dott.it green removed at token level).

**Empty Neon:**

```bash
pnpm prisma migrate deploy --schema=prisma/user/schema.prisma
pnpm prisma migrate deploy --schema=prisma/assessment/schema.prisma
```

**CI:** `.github/workflows/ci.yml` — install, prisma generate, lint, `test:unit`, build (dummy DB env). No Playwright in CI yet.

**Demo seed (mock only):** `pnpm db:seed:demo` creates tenant `dott-demo` (`demo.dott.it`), one teacher user with bcrypt password, 8 learners, one formative assessment with 5 responses (2 with draft feedback). Credentials: `DEMO_TEACHER_EMAIL` / `DEMO_TEACHER_PASSWORD` in `~/.config/dott-it/neon.env` (also set on Vercel for Production login).

## Technical decisions log

| Date | Decision |
|---|---|
| 2026-10-22 | AI feedback OFF in v1 |
| 2026-10-22 | Per-teacher Google OAuth; no Dott.it Workspace / DWD dependency |
| 2026-10-22 | Stack: Vercel Hobby + Neon Free + GitHub |
| 2026-11-05 | Product/repo identity: Dott.it / `dott-it/dott-it` (private) |
| 2026-11-05 | Brand in UI: orange-led primary (not Dott.it green) |
| 2026-11-05 | Empty DB start — no legacy PII migration |
| 2026-11-05 | Stay on `*.vercel.app` until a domain is purchased |
| 2026-11-05 | Bootstrap: near-full Dott.it copy; schemas/migrations kept; seeds/DB data/GCP deploy excluded |

## Open technical questions

- GCP project + OAuth consent screen under Dott.it brand
- Exact license/attribution handling for OpenSciEd templates in-repo
- Chunking / job design for Forms response sync under Hobby duration limits
- Whether/when the GitHub repo becomes public (process in `STRATEGY.md`)
