# Accessibility review backlog

Target: **WCAG 2.1 Level AA**. Full platform code-level review covering ~311 TSX files.

---

## Phase 1 — ESLint / jsx-a11y (baseline)

- **Command:** `pnpm lint` (Next.js ESLint; `eslint-plugin-jsx-a11y` pulled in via `eslint-config-next`).
- **Result:** Run fails on non-a11y issues (`unicorn/filename-case`, `unicorn/consistent-function-scoping`, `no-console`, `react-hooks/exhaustive-deps`). Address separately for a clean lint pipeline.
- **TSX sweep:** `pnpm exec eslint "**/*.{tsx,jsx}"` filtered for `jsx-a11y` showed **no jsx-a11y rule violations**.

## Phase 2 — Automated axe (Playwright)

- **Dependency:** `@axe-core/playwright` (devDependency).
- **Spec:** [`e2e/accessibility.e2e.spec.ts`](../e2e/accessibility.e2e.spec.ts).
- **Tests:**
  - **Login** (`/login`): no serious/critical axe violations. **Passes.**
  - **Workspace** and **Backoffice**: require demo sign-in; skip gracefully when DB is unreachable.
- **Run:** `pnpm exec playwright test e2e/accessibility.e2e.spec.ts --project=e2e --config=playwright-local.config.ts`
- **Prerequisite:** `pnpm exec playwright install` if browsers are not yet installed.

---

## Comprehensive code-level findings and fixes

### P0 — Critical (fixed)

| Issue | WCAG | Files | Fix applied |
|-------|------|-------|-------------|
| Nested `<main>` landmarks (root layout wraps children in `<main>`, dashboard and auth layouts add a second `<main>`) | 1.3.1 | `app/layout.tsx`, `app/(dashboard)/layout.tsx`, `app/(auth)/layout.tsx` | Root layout no longer wraps in `<main>`; child layouts provide the single `<main id="main-content">`. |
| No skip-to-main-content link | 2.4.1 | `app/layout.tsx` | Added skip link (`<a href="#main-content">`) that becomes visible on focus. |
| Custom confirmation modals without dialog semantics or focus management | 4.1.2, 2.1.1, 2.4.3 | `components/feedback-history-thread-view.tsx` (delete confirm), `components/ui/assessment-history/feedback-attached-section.tsx` (clear all) | Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`. |
| Custom full-page export modals without dialog role | 4.1.2, 2.4.3 | `app/lib/components/assessment/student-export-modal.tsx`, `app/lib/components/assessment/assessment-export-modal.tsx` | Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-label` on close buttons. |

### P1 — Serious (fixed)

| Issue | WCAG | Files | Fix applied |
|-------|------|-------|-------------|
| Multiple `<h1>` per page (AppHeader brand + page title) | 1.3.1 | `app/lib/components/ui/layout/header/app-header.tsx` | Brand "eddo" renders as `<span>` (`component="span"`) instead of `<h1>`. Page headers keep `<h1>`. |
| Student progress filter divs not keyboard-accessible | 2.1.1 | `app/lib/components/assessment/student-progress.tsx` | Added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), `aria-label`, `focus-visible` ring. |
| Mobile sidebar Sheet without accessible title | 4.1.2 | `components/ui/sidebar.tsx`, `components/mobile-nav.tsx` | Added `aria-label` and sr-only heading. |
| Icon-only buttons without accessible name | 4.1.2 | Multiple (see list below) | Added `aria-label` to each. |
| Loading component not announced to screen readers | 4.1.3 | `app/lib/components/ui/layout/loading/loading.tsx` | Added `role="status"`, `aria-live="polite"`, `aria-label`. |
| Form inputs without labels | 1.3.1, 4.1.2 | `components/course-search.tsx`, `components/assessment-record-list.tsx`, `components/feedback-history-thread-view.tsx` | Added `aria-label` to search and message inputs. |
| SelectTrigger `id` missing (Label `htmlFor` broken) | 1.3.1, 4.1.2 | `components/create-assessment-dialog.tsx`, `components/backoffice/users/user-edit-form.tsx` | Added `id` on `SelectTrigger` to match `Label htmlFor`; added `aria-required` where `*` is shown. |
| Clickable table rows not keyboard-accessible | 2.1.1 | `app/lib/components/ui/layout/data-table.tsx` | `tabIndex={0}`, Enter/Space support, `aria-label` via `getRowAriaLabel`, `aria-sort` on sortable headers (prior pass). |
| QR code images without alt/description | 1.1.1 | `components/assessment-form-modal.tsx`, `app/lib/components/ui/feedback/live-collection-modal.tsx` | `sr-only` description + `aria-hidden` wrapper (prior pass). |
| Chart container without accessible name | 1.1.1 | `components/ui/chart.tsx` | Default `role="img"` + `aria-label` (prior pass). |

### Icon-only button fixes (all P1)

| File | Button | `aria-label` added |
|------|--------|-------------------|
| `components/ui/assessment-history/feedback-side-card.tsx` | X (close) | "Close feedback panel" |
| `components/assignment-dialog.tsx` | Copy | "Copy session link" |
| `components/feedback-display.tsx` | ChevronUp/Down (expand/collapse) | "Collapse/Expand feedback" |
| `components/feedback-display.tsx` | ThumbsUp | "Rate feedback positively" + `aria-pressed` |
| `components/feedback-display.tsx` | ThumbsDown | "Rate feedback negatively" + `aria-pressed` |
| `app/(dashboard)/workspace/assessments/create/page.tsx` | ArrowLeft (back) | "Go back" |
| `app/lib/components/assessment/student-export-modal.tsx` | X (close) | "Close export dialog" |
| `app/lib/components/assessment/assessment-export-modal.tsx` | X (close) | "Close export dialog" |

---

### P2 — Addressed (WCAG 2.1 AA follow-through)

| Area | WCAG | What changed |
|------|------|--------------|
| Icon-only controls | 4.1.2 | `aria-label` / `aria-pressed` on strength/suggestion bubbles, AI rating/copy/regenerate, thread preview card remove; `feedback-bubbles`, `assessment-history-container`, `sortable-card`, `feedback-preview-modal`, `tooltip-icon-button` (`sr-only`), etc. (prior pass) |
| Forms | 1.3.1, 4.1.2 | Shared `FormField`, assessment create form, `evaluation-form` (`aria-labelledby` on `RadioGroup`, `htmlFor` + textarea `id`, help trigger), `assignment-dialog`, live collection URL (`<label htmlFor="form-url">`, `aria-describedby` hint) |
| Page titles | 2.4.2 | Root `metadata.title.template` (`%s \| Eddo`); segment `layout.tsx` files under `(auth)/login`, `(dashboard)/workspace/**`, `(dashboard)/backoffice/**`, `test-api` |
| Headings | 1.3.1 | Workspace error state: lone heading uses `<h1>` |
| Live regions | 4.1.3 | Filter count line in `assessment-record-list.tsx`; draft badge row in `feedback-history-thread-view.tsx`; creating state in `create-assessment-dialog.tsx`; search loading in `course-search.tsx`; saving in `feedback-attached-section.tsx` |
| Non-semantic controls | 2.1.1 | Keyboard-focusable `role="button"` rows in `feedback-history-thread-view.tsx`; selectable cards in tenant add-user/add-teacher dialogs; `feedback-side-card` (prior pass) |
| Focus / contrast (partial) | 1.4.11, 2.4.7 | `SelectTrigger`: `focus-visible` rings, `disabled:opacity-60`; `student-list` filters: `focus-visible`; muted icon colors where touched in thread view |

### P2 — Deferred (larger or open-ended)

| Issue | WCAG | Notes |
|-------|------|-------|
| Custom confirmation / export overlays | 2.4.3, 2.1.2 | No programmatic focus trap or initial focus in some custom dialogs; migrate confirmations to Radix `AlertDialog` and heavy overlays to Radix `Dialog` when feasible |
| Global contrast sweep | 1.4.3, 1.4.11 | Residual `text-gray-*` / disabled styling across all TSX; continue replacing with semantic tokens (`text-muted-foreground`, etc.) and validating contrast |

**Optional follow-up (not blocking P2):** error-branch heading order (`<h1>` vs `<h2>`), spot-check gray/disabled contrast and `focus-visible`, stricter focus traps via Radix dialogs, and richer `generateMetadata` (human-readable names instead of raw ids).

---

## Test updates

- `app/lib/__tests__/components/assessment/assessment-export-modal.test.tsx`: Updated to query close button by `aria-label` instead of empty name (`name: ''`). Merged duplicate close-button tests. All 35 tests pass.
- `app/lib/components/ui/layout/__tests__/data-table.test.tsx`: Keyboard activation tests for Enter/Space added (prior pass). All 16 tests pass.

## References

- [WAI sortable table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
- [WAI dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI alert dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
- [axe-core rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Level AA quick reference](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa#principle1)
