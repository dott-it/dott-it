# AGENTS

## Design System
- Use shadcn component system for UI

## Behavior-Driven Development

- Design features and components using Behavior-Driven Development (BDD) principles.
- When creating tests, describe behaviors with readable phrases (e.g. `should handle invalid input`).
- Keep tests under the `tests/` directory and use Node's `test` module with `assert/strict`.

## Unit Testing

- Ensure new features include corresponding unit tests.
- Run `pnpm lint`, `pnpm test:unit`, and `pnpm test` before committing changes.
- The test suite runs offline by default. To include optional network checks, run `TEST_ONLINE=1 pnpm test`.
