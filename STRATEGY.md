# Dott.it — Strategy

> Business, brand, people, and go-to-market. Engineering detail lives in `TECHNICAL.md`.
> Updated: 2026-11-05

## Context

Dott.it as a funded startup is over: no remaining budget for infra/ops, and the previous operator stepped away. Agreement in principle:

- Dott.it code can be released as open source.
- A new independent project may reuse Dott.it’s ideas/logic under a **new name, brand, and infrastructure**.
- The old database is deleted by the previous operator — **no student PII migrates**.

Dott.it is that continuation: same product family teachers already knew, orange-led brand, free-tier reality.

## Diagnosis (why Dott.it struggled)

Teachers were already overloaded. Dott.it often **increased** cognitive load:

- Manual organization of classes, students, and assessments before any value.
- Class/lesson structure inside the product was painful enough that teachers abandoned it.
- Features shipped for what was *possible*, not for what removed work from the day.

**Lesson:** a tool that requires the teacher to get organized first loses to a notebook and to Google Classroom.

## Bet

Dott.it-parity product + free-tier stack + orange rebrand — not a blank Notion for teachers. Defaults over flexibility. Classroom and Forms stay the systems teachers already use; Dott.it sits on top.

Success for the pilot: a teacher plans a week and collects + gives feedback **without organizing everything by hand first**.

## Brand

- **Name:** Dott.it (pun on “got it”). GitHub slug `dott-it` (`.` not allowed in logins).
- **Palette:** orange-led (Dott.it was green).
- **Domain:** `dott.it` is taken; stay on `*.vercel.app` until purchase. Inventory in `DOMAINS.md`.
- **Retired working title:** AnchorPlan (2026-10-22).

Tagline options (not locked): “Got it.” / “Plan your year. Teach this week.” / “The planner that already knows your classes.”

## Operating model

- Part-time, non-profit posture for now.
- First revenue → infrastructure and development first (starting with Vercel Pro ~$20/mo, then domain, then Neon upgrade) — see infra table in `TECHNICAL.md`.
- Day jobs come first; no unpaid crunch. Minimum weekly commitment so the project does not die.
- Foundation-phase product/tech calls are recorded in writing so later steering does not reopen every decision.
- CEO seat (product direction, teachers, sustainability) engages once there is something concrete to steer.

## Pilot validation (before building beyond v1)

1. Talk to 2–3 teachers who complained about class/lesson organization in Dott.it; map how they plan today.
2. Ship v1 technical scope (`TECHNICAL.md`) to ~5 teachers.
3. Only after that: AI feedback, in-app form builder, thematic analysis.

## Strategic decisions log

| Date | Decision |
|---|---|
| 2026-10-22 | Spin off under new name/brand; no PII migration |
| 2026-10-22 | Zero-cost pilot; first money upgrades infra |
| 2026-10-22 | Foundation decisions written down before broader steering |
| 2026-11-05 | Name locked: **Dott.it**; GitHub org/repo `dott-it` |
| 2026-11-05 | Repo private for now |
| 2026-11-05 | Public open-source timing TBD; written confirmation of Dott.it code release still pending |

## Open strategic questions

- Domain choice after alignment (see `DOMAINS.md`)
- Which ~5 pilot teachers (OpenSciEd or not?)
- Exact minimum weekly hours from each founder
- When (if) to open-source the Dott.it repo
- Written record of the Dott.it code-release agreement
