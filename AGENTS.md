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
- Oxlint's JS Plugin API is alpha. Treat that as a standing compatibility risk to watch, not a reason to change the accepted architecture without concrete evidence of breakage.
- The comment-formatting rules ship as their own opt-in layer (`comments.json` and the `comments/plugin` subpath export), never bundled into `base`. Consumers keep their current behaviour until they explicitly add the layer.
- Plugin source layout: `comments/plugin.js` aggregator, one file per rule at `comments/rules/<rule-id>.js`, shared helpers in `comments/utils/`; tests mirror at `test/comments/<rule-id>.test.js`. Rule ids are namespaced `comments/<rule-id>`. Keep this layout for future phases.
- Rules stay independent: don't fold one rule's ownership into another to dodge a fix interaction. Accepted consequence: one block-comment shape (single-line `/* ... */` needing both wrapping and terminal punctuation) takes two `oxlint --fix` passes to converge, covered by `test/comments/oxlint-integration/block-wrap-punctuation-collision`.
- Oxlint's JS Plugin API doesn't parse Vue SFCs (`.vue` is "Not supported yet"). For Vue-aware comment rules, `context.physicalFilename` gives the real `.vue` path but `context.sourceCode.text` holds only the extracted script block, with `<script setup>` and plain `<script>` producing identical Program ASTs. The plugin detects `<script setup>` by reading the raw file via `physicalFilename` and text-matching the tag: a deliberate compatibility workaround, replaceable if Oxlint adds native SFC support.
- Mapping a `Program` visit back to its raw `<script>` block: match by trimmed content equality (`context.sourceCode.text` against the regex-captured block content). Raw-vs-extracted text equality fails on any whitespace reformatting; a source-order index fails because script blocks from different files interleave in a multi-file run and `createOnce` closure state desyncs across calls.
- Oxlint inline disable comments (`oxlint-disable[-next-line]`) work only for rules authored natively against the JS Plugin API; a closed, not-planned Oxlint bug makes them silently ignored for rules run through the `oxlint-plugin-eslint` compatibility wrapper. Every rule here is native, so verification fixtures can rely on inline disables.
- Any rule that reformats, groups, or reorders comments must filter directive comments (`eslint-`, `oxlint-`, `istanbul-`, `c8-` prefixes) with `isDirectiveComment` before treating a comment as a fixer target or a group leader. This is a recurring bug class, not only a fixer-output concern.
- The oxlint-integration verification command carries `--report-unused-disable-directives` so a suppression comment for a rule that silently never fired is flagged instead of passing cleanly. Keep it in every rule task's verification.

## Working style

- Project state (tasks, chunks, queue, decisions, discoveries, handoff) lives in the `progress` CLI. Run `progress next --json` at session start.
- Small, reviewable chunks; one Conventional Commit per chunk.
