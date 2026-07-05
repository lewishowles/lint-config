# @lewishowles/lint-config

Shared lint and format configuration for Lewis Howles projects. One package that every repo extends, so lint setup stops being duplicated and drifting across the ecosystem.

## Purpose

Today every repo carries its own copy of the same lint stack (`@eslint/js`, `@stylistic/eslint-plugin`, `globals`, per-repo `config/eslint/` folders, plus Vue/Vitest/Cypress plugins where relevant). Changing a convention means touching every repo by hand. This package centralises that: consumers install one dev dependency and extend a named config layer.

## Constraints and context

- The ecosystem is mid-migration to **vite-plus (`vp check`) with oxlint/oxfmt**. This package must target the post-migration world, not codify the outgoing ESLint setup. Do not build ESLint-first unless the migration stalls; confirm the current state of the migration before implementing anything.
- Layered exports, chosen per project: `base` (all JS/TS), `vue`, `playwright`. Automatic rule detection is out of scope; consumers pick layers explicitly.
- Consumers: components, helpers, testing, cli-style, boilerplate, howles.dev, blog (Astro — may need its own layer or stay out of scope initially), extensions.
- This is a personal-ecosystem package. External users are welcome but not a design constraint; keep the API surface minimal.
- Runtime: Bun for development, published to npm under `@lewishowles/`.
- Follow the conventions of the sibling packages (`helpers` is the reference for repo hygiene: scripted checks, publint/attw, generated docs where useful).

## Working style

- `PROGRESS.md` at the root is the plan and session handoff. Read it first.
- Small, reviewable chunks; one Conventional Commit per chunk.
- No git history is created here yet; the repo will be initialised when implementation starts.
