# @lewishowles/lint-config

Shared Oxlint configuration for Lewis Howles projects. Projects extend this package to keep their lint configuration consistent across projects, instead of copying and maintaining the same rules everywhere.

## Installation

```sh
bun add -d @lewishowles/lint-config @stylistic/eslint-plugin vite-plus
```

`@stylistic/eslint-plugin` and `vite-plus` are peer dependencies: they must be installed in the consuming project so oxlint can resolve the JS plugins from `node_modules`.

## Usage

Create a `.oxlintrc.json` in your project root that extends the appropriate layer:

### Base layer (all JS/TS projects)

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/base.json"],
	"env": { "builtin": true, "browser": true },
	"ignorePatterns": ["**/dist/*", ".codebase-memory/**"]
}
```

Note that `env` has to be redeclared here: Oxlint doesn't yet merge it through `extends`, so `base.json`'s own `env` never reaches your project. See [known limitations](docs/limitations.md) for why.

### Vue layer (Vue 3 projects)

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/vue.json"],
	"env": { "builtin": true, "browser": true },
	"globals": {
		"defineEmits": "readonly",
		"defineExpose": "readonly",
		"defineModel": "readonly",
		"defineOptions": "readonly",
		"defineProps": "readonly",
		"defineSlots": "readonly",
		"withDefaults": "readonly"
	},
	"ignorePatterns": ["**/dist/*", ".codebase-memory/**"]
}
```

The Vue layer extends `base.json` internally, so you only need to extend `vue.json`. The same `env`/`globals` limitation applies here too, which is why both are redeclared above.

### Comment formatting (optional)

Add the comments layer alongside the base or Vue layer to enforce the comment-formatting rules, including moving trailing line comments onto their own line, variable-declaration documentation, JSDoc on named functions and first-level object methods, documentation directly after each Vue `<script setup>` opening tag, and block comments for runtime `defineProps` properties:

```json
{
	"extends": [
		"./node_modules/@lewishowles/lint-config/base.json",
		"./node_modules/@lewishowles/lint-config/comments.json"
	],
	"env": { "builtin": true, "browser": true },
	"ignorePatterns": ["**/dist/*", ".codebase-memory/**"]
}
```

For functions, variables, configured API calls and classes, a tool directive comment such as `// eslint-disable-next-line` may sit between the documentation comment and the code.

For destructured parameters with defaults, document the parent and each property. Plain names such as `result.errors` and optional names such as `[result.errors]` or `[result.errors=[]]` all match `errors = []`. The parent can likewise be `result`, `[result]` or `[result={}]`. A documented default does not have to match the value in the code.

Lines below a free-form tag such as `@description` or `@note` start at the comment margin so they can be pasted into Markdown without becoming a code block. `@example` content is left as written. Wrapped `@param`, `@returns` and `@throws` descriptions keep a four-space hanging indent so each description is easy to scan beneath its tag. A description written as `name - description` loses the hyphen when it moves onto its own line.

Consecutive `//` comments keep their line breaks, and only a line past 80 columns is wrapped.

The Vue component rule reads the raw `.vue` file because Oxlint's JS Plugin API only receives the extracted script block. The comments layer loads its plugin for you, so there's no relative `jsPlugins` path to add. To pick rules yourself instead, add the plugin directly:

```json
{
	"jsPlugins": [
		{
			"name": "comments",
			"specifier": "@lewishowles/lint-config/comments/plugin"
		}
	],
	"rules": {
		"comments/formatting": "error"
	}
}
```

The `comments/vue-prop-documentation` rule requires an indented block comment immediately before every runtime property in `defineProps`. A matching comment on a `defineProps` property also documents its `withDefaults` entry; type-only props are not checked.

The `comments/vue-emit-documentation` rule requires an indented block comment immediately before every runtime property in `defineEmits`. Function-valued events also require the normal JSDoc tags; array-form and type-only emits are not checked.

The `comments/configured-api-calls` rule requires an immediately preceding line comment before configured bare-identifier calls such as Vue lifecycle hooks, reactive effects, and `onClickOutside`. A documented variable declaration covers a direct call initializer; member-expression calls are out of scope. Add project-specific APIs without replacing the built-in list:

```json
{
	"rules": {
		"comments/configured-api-calls": ["error", { "additionalApis": ["subscribe"] }]
	}
}
```

The `comments/variable-declarations` rule accepts a `rootOnly` option to require comments only before root-level `const`, `let`, and `using` declarations. The comments layer already enables `rootOnly` for test files matched by `**/*.test.*`, `**/*.spec.*`, and `**/test/**`; other files keep the default of `false`. Override it for another scope or to change the behaviour:

```json
{
	"rules": {
		"comments/variable-declarations": ["error", { "rootOnly": true }]
	}
}
```

The `comments/class-documentation` rule requires an immediately preceding block comment before class declarations and const-assigned class expressions. Constructors, methods, getters, and setters require full JSDoc; constructors never need an `@returns` tag, and getters and setters need one only when they return a value. Instance and static fields require an immediately preceding line comment.

### `vp check` configuration

On vite-plus 1.0.0, `vp check` and `vp lint` take their Oxlint settings from the `lint` block in `vite.config.js`. They ignore a `.oxlintrc.json` on its own, even though the Vite+ documentation says `vp lint` finds Oxlint config files by itself. If `vite.config.js` is missing, both commands quietly fall back to default settings. You still see plausible warnings and exit codes, but none of your rules are applied.

Each consuming repo needs a `vite.config.js` with a `lint` block. Use `lintConfig` with the layers you want. Oxlint ignores `env` and `globals` in configs listed under `extends`, so `lintConfig` copies them into the `lint` block itself, including values from the layers each one extends. Without that, `no-undef` reports Vue macros such as `defineProps` and browser globals such as `window` (see [docs/limitations.md](docs/limitations.md)). The Vue layer already includes base; add comments only if you want the comment rules. You can pass your project's `.oxlintrc.json` as the second argument to keep its local settings. `lintConfig` ignores the `extends` list in that file, so list every layer you want in the first argument.

```js
import { defineConfig } from "vite-plus";
import { base, comments, lintConfig } from "@lewishowles/lint-config/layers";
import oxlintrc from "./.oxlintrc.json" with { type: "json" };

export default defineConfig({
	lint: lintConfig([base, comments], oxlintrc),
});
```

For a Vue project, use `lintConfig([vue, comments], oxlintrc)` and import `vue` instead of `base`. The local config is optional; `lintConfig([vue, comments])` also works. If you combine layers by hand, use object layers in `extends` and lift their `env` and `globals` to the top level yourself. Spreading JSON layers together replaces earlier `jsPlugins`, `overrides`, and `rules` arrays or objects.

Verify the setup with `vp lint --print-config <file>` and check that your real values, not defaults, are active. The printed `rules` leave out every rule that comes from a plugin, such as `comments/*` and `@stylistic/*`, even when those rules are running. To check a plugin layer, confirm the plugin is listed in `jsPlugins`, then lint a file that breaks one of its rules.

Vite+ also adds its own `vite-plus` lint plugin, so `vp check` can report rules that this package doesn't define. For example, `vite-plus/prefer-vite-plus-imports` reports imports from `oxlint` packages that Vite+ already provides, such as `oxlint/plugins-dev`.

## Customising

Your project's `.oxlintrc.json` can override rules, add ignore patterns, add overrides, or add plugins on top of the shared layer.

### Overriding a rule

To change the severity or options of a rule defined in the shared layer, redeclare it in your project config: your value wins.

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/base.json"],
	"rules": {
		"no-unused-vars": "warn"
	}
}
```

### Adding ignore patterns

Ignore patterns are project-specific, so they always live in your project config:

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/base.json"],
	"ignorePatterns": ["**/dist/*", ".codebase-memory/**", "support/**"]
}
```

### Adding overrides

Overrides are additive in the `vite.config.js` lint block: shared overrides still apply, and your local ones are appended.

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/base.json"],
	"overrides": [
		{
			"files": ["bin/**/*.js", "src/cli/**/*.js"],
			"env": { "node": true }
		},
		{
			"files": ["**/*.test.js"],
			"rules": { "no-unused-vars": "off" }
		}
	]
}
```

### Adding plugins

Plugins are additive and deduplicated: your local plugins are added to the shared ones. Oxlint's `plugins` field only accepts built-in plugin names, such as `oxc`, `typescript`, `unicorn`, and `vue`; there's no `playwright` or `vitest` plugin. Custom JS plugins, like this package's `comments` plugin, load through `jsPlugins` instead. Test-file-specific behaviour is handled via `overrides`, not plugins.

## Layers

| Layer      | File            | Contents                                                                                        |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `base`     | `base.json`     | Correctness and formatting rules, import sorting, `import`/`oxc`/`typescript`/`unicorn` plugins |
| `comments` | `comments.json` | Optional comment-formatting rules, variable-declaration documentation, JSDoc checks             |
| `vue`      | `vue.json`      | Extends `base`, adds the `vue` plugin, Vue compiler macro globals, Vue-specific rules           |

### Import sorting

The base lint layer sorts named members within each import statement. To sort whole import statements, opt in to `imports.json`. It contains Oxfmt settings, not an Oxlint layer, so add it to the `fmt` block in `vite.config.js`:

```js
import { defineConfig } from "vite-plus";
import importFormat from "@lewishowles/lint-config/imports.json" with { type: "json" };
import oxfmtrc from "./.oxfmtrc.json" with { type: "json" };

export default defineConfig({
	fmt: { ...oxfmtrc, ...importFormat },
});
```

If your `vite.config.js` already has a `lint` block, add `fmt` to the same `defineConfig` call: `defineConfig({ lint, fmt: { ...oxfmtrc, ...importFormat } })`.

This puts named imports first, including `import type { … }` and imports with both default and named members. Other default imports come second, along with `import type` default imports and namespace imports (`import * as`). `.vue` imports come last. Oxfmt sorts each group by module path, ignoring letter case, and separates the groups with blank lines. Side-effect imports keep their written order and position, so keep them at the top or bottom of your imports: one written among the other imports stays where it is and splits the group around it.

### Parent-folder imports

The base layer reports imports from a parent folder (`../`), with no automatic fix. Same-folder (`./`), `@/` alias and package `#` subpath imports are allowed. After upgrading, any existing `../` imports fail lint until they move to an `@/` alias or, in a package without one, to [package subpath imports](https://nodejs.org/api/packages.html#subpath-imports).

## What stays repo-local

- `ignorePatterns`, since every project has different build output and tool directories
- `overrides` for project-specific directories (e.g. `bin/**/*.js`, `src/cli/**/*.js`, `src/playwright/**/*.js`), since the file paths differ per project and can't be generalised. The `vite.config.js` lint block appends these local entries after the shared layer overrides.
- Rule relaxations for specific file patterns (e.g. turning off `vite-plus/prefer-vite-plus-imports` in generated `.d.ts` files)
- Additional plugins, only for projects that need them

## Merge semantics

When a project's `.oxlintrc.json` extends a shared layer:

- **Rules** shallow-merge by key: your value wins for any rule defined in both
- **Overrides** are additive in the `vite.config.js` lint block: it concatenates shared layer and local `overrides` entries, including any `env` declared inside an override block
- **Plugins** are additive: both shared and local `plugins`/`jsPlugins` load, deduplicated
- **`env`, `globals`, and `ignorePatterns` don't merge through `extends` at all** (an open Oxlint bug), which is why the usage examples above redeclare `env`/`globals` directly. See [known limitations](docs/limitations.md) for the full detail, including the separate `vite-plus` caveat around resolving `extends` paths.
