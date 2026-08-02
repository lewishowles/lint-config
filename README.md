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

Add the comments layer alongside the base or Vue layer to enforce the comment-formatting rules, variable-declaration documentation, JSDoc on named functions and first-level object methods, documentation directly after each Vue `<script setup>` opening tag, and block comments for runtime `defineProps` properties:

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
		"comments/line-comments": "error"
	}
}
```

The `comments/vue-prop-documentation` rule requires an indented block comment immediately before every runtime property in `defineProps`. A matching comment on a `defineProps` property also documents its `withDefaults` entry; type-only props are not checked.

The `comments/configured-api-calls` rule requires an immediately preceding line comment before configured bare-identifier calls such as Vue lifecycle hooks, reactive effects, and `onClickOutside`. A documented variable declaration covers a direct call initializer; member-expression calls are out of scope. Add project-specific APIs without replacing the built-in list:

```json
{
	"rules": {
		"comments/configured-api-calls": ["error", { "additionalApis": ["subscribe"] }]
	}
}
```

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

Overrides are additive: shared overrides (if any) still apply, and your local ones are appended.

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

| Layer      | File            | Contents                                                                               |
| ---------- | --------------- | -------------------------------------------------------------------------------------- |
| `base`     | `base.json`     | Correctness and formatting rules, import sorting, `oxc`/`typescript`/`unicorn` plugins |
| `comments` | `comments.json` | Optional comment-formatting rules, variable-declaration documentation, JSDoc checks    |
| `vue`      | `vue.json`      | Extends `base`, adds the `vue` plugin, Vue compiler macro globals, Vue-specific rules  |

### Import sorting

The base layer sorts named members within each import statement, but leaves declaration order (which import comes first) to Oxfmt: enable Oxfmt's `sortImports` option in your local `.oxfmtrc.json` if you want that sorted and fixed automatically.

## What stays repo-local

- `ignorePatterns`, since every project has different build output and tool directories
- `overrides` for project-specific directories (e.g. `bin/**/*.js`, `src/cli/**/*.js`, `src/playwright/**/*.js`), since the file paths differ per project and can't be generalised
- Rule relaxations for specific file patterns (e.g. turning off `vite-plus/prefer-vite-plus-imports` in generated `.d.ts` files)
- Additional plugins, only for projects that need them

## Merge semantics

When a project's `.oxlintrc.json` extends a shared layer:

- **Rules** shallow-merge by key: your value wins for any rule defined in both
- **Overrides** are additive: both shared and local `overrides` entries apply, including any `env` declared inside an override block
- **Plugins** are additive: both shared and local `plugins`/`jsPlugins` load, deduplicated
- **`env`, `globals`, and `ignorePatterns` don't merge through `extends` at all** (an open Oxlint bug), which is why the usage examples above redeclare `env`/`globals` directly. See [known limitations](docs/limitations.md) for the full detail, including the separate `vite-plus` caveat around resolving `extends` paths.
