# @lewishowles/lint-config

Shared oxlint configuration for Lewis Howles projects. One package that every repo extends, so lint setup stops being duplicated and drifting across the ecosystem.

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
	"ignorePatterns": ["**/dist/*", ".codebase-memory/**"]
}
```

### Vue layer (Vue 3 projects)

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/vue.json"],
	"ignorePatterns": ["**/dist/*", ".codebase-memory/**"]
}
```

The Vue layer extends `base.json` internally, so you only need to extend `vue.json`.

## Customising

Your `.oxlintrc.json` stub can override rules, add ignore patterns, add overrides, or add plugins on top of the shared layer.

### Overriding a rule

To change the severity or options of a rule defined in the shared layer, redeclare it in your stub: your value wins.

```json
{
	"extends": ["./node_modules/@lewishowles/lint-config/base.json"],
	"rules": {
		"no-unused-vars": "warn"
	}
}
```

### Adding ignore patterns

Ignore patterns are repo-specific, so they always live in your stub:

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

Plugins are additive and deduplicated: your local plugins are added to the shared ones. Note that oxlint only supports its built-in plugin names (`oxc`, `typescript`, `unicorn`, `vue`, etc.); there is no `playwright` or `vitest` plugin. Test-file-specific behaviour is handled via `overrides`, not plugins.

## Layers

| Layer  | File        | Contents                                                                                                                                                                                                                              |
| ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base` | `base.json` | Correctness rules, `@stylistic` formatting rules, `vite-plus/prefer-vite-plus-imports`, `oxc` + `typescript` + `unicorn` plugins, browser env, node env for config files (`vite.config.*`, `vitest.config.*`, `playwright*.config.*`) |
| `vue`  | `vue.json`  | Extends `base`. Adds `vue` plugin, Vue compiler macros as globals, Vue-specific rules                                                                                                                                                 |

## What stays repo-local

- `ignorePatterns`, since every repo has different build output and tool directories
- `overrides` for repo-specific directories (e.g. `bin/**/*.js`, `src/cli/**/*.js`, `src/playwright/**/*.js`), since the file paths differ per repo and can't be generalised
- Test-file rule relaxations (e.g. turning off `vite-plus/prefer-vite-plus-imports` in `*.d.ts`)
- Additional plugins, only for repos that need them

## Merge semantics

When a consumer stub extends a shared layer:

- **Rules** shallow-merge by key: the consumer's value wins for any rule defined in both
- **Overrides** are additive: both shared and local `overrides` entries apply, including any `env` declared inside an override block
- **Plugins** are additive: both shared and local `plugins`/`jsPlugins` are loaded (deduplicated)

### Known oxlint limitation: top-level `env`, `globals`, and `ignorePatterns` don't merge through `extends`

oxlint currently drops top-level `env`, `globals`, and `ignorePatterns` from an extended config file entirely: they only take effect if declared directly in the file oxlint is invoked with. This is an open upstream bug: [oxc-project/oxc#20087](https://github.com/oxc-project/oxc/issues/20087) (open as of oxlint 1.72.0).

In practice this means:

- `base.json`'s `env` (`builtin`, `browser`) and `vue.json`'s Vue macro `globals` (`defineProps`, `defineEmits`, etc.) will **not** reach a consumer that only does `{ "extends": ["./node_modules/@lewishowles/lint-config/vue.json"] }`: every global from the shared layer will be flagged by `no-undef`.
- Any `ignorePatterns` this package might declare would be silently dropped the same way, so it deliberately ships none. See "What stays repo-local" below.

Until this is fixed upstream, redeclare the `env`/`globals` you need directly in your project's `.oxlintrc.json`, even though `base.json`/`vue.json` already declare them:

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

### Known limitation: `vite-plus`'s `lint` config field requires resolved objects, not string paths

Raw oxlint (CLI, editor integrations) accepts `"extends": ["./node_modules/@lewishowles/lint-config/vue.json"]` as string paths and resolves them at load time. `vite-plus`, when a project routes its oxlint config through `vite.config.js`'s `lint` field (importing `.oxlintrc.json` as JSON and handing it to `vp check`/`vp lint`), does not resolve string paths in `extends`: every entry, at every nesting level, must already be a plain object. This means `vue.json`'s own internal `extends: ["./base.json"]` also breaks one level deeper.

If your project uses `vite-plus`'s `lint` field rather than raw oxlint, resolve the chain yourself in `vite.config.js`:

```js
import base from "@lewishowles/lint-config/base.json" with { type: "json" };
import vue from "@lewishowles/lint-config/vue.json" with { type: "json" };

const lint = { ...vue, extends: [base, ...(vue.extends ?? [])] };
```

`.oxlintrc.json` itself should stay untouched (string `extends`) for raw oxlint/editor consumption; this only applies to the `vite-plus` config path.
