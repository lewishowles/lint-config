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
- Oxlint's JS Plugin API fixer treats two rules' fix ranges as conflicting whenever they touch or overlap, even if the resulting text is byte-identical at that boundary. When authoring a fixer for a comment-formatting rule that shares comment text with another rule, verify the two rules' minimal replacement ranges are genuinely disjoint, not just non-identical.
- `vite-plus`'s `vp check`/`vp lint` read Oxlint settings only from a `vite.config.js` `lint` block, never from `.oxlintrc.json` directly, and silently fall back to an unrelated default config with no error when `vite.config.js` is missing — a plain `.oxlintrc.json` with no `vite.config.js` looks like it works (plausible warnings, sensible exit codes) while never having applied a single key from it. When wiring up `vp check`/`vp lint` in any repo, add a `vite.config.js` that imports the relevant config layer(s) and `.oxlintrc.json` as JSON and builds the `lint` block from them, then verify with `vp lint --print-config <file>` that the real values (not defaults) are active.
- Oxlint's native JS Plugin API supports per-rule configuration via `context.options` (`node_modules/@oxlint/plugins/index.d.ts`: `Context.options`, `Options = JsonValue[]`, `RuleOptionsSchema`). A rule that declares options must set `meta.schema`; `meta.defaultOptions` is optional, and user options merge over defaults. `comments/configured-api-calls`'s `additionalApis: string[]` option is the repo's precedent for shape and style — follow it for any future rule that takes configuration.
- `.agent/` and `.serena/` are excluded from git only via this user's **global** gitignore (`~/.config/git/ignore`), not a repo-local `.gitignore`. `vp check` doesn't consult the global gitignore, so it still traverses and flags files under those directories. Don't assume a `vp check`-only formatting hit on a `.agent/`/`.serena/` path is a false positive; verify with a direct fix or diff before dismissing it.

## Working style

- `PROGRESS.md` at the root is the plan and session handoff. Read it first.
- Small, reviewable chunks; one Conventional Commit per chunk.
- No git history is created here yet; the repo will be initialised when implementation starts.
