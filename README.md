# @lewishowles/lint-config

Shared oxlint configuration for Lewis Howles projects. One package that every repo extends, so lint setup stops being duplicated and drifting across the ecosystem.

## Installation

```sh
bun add -d @lewishowles/lint-config @stylistic/eslint-plugin vite-plus
```

`@stylistic/eslint-plugin` and `vite-plus` are peer dependencies — they must be installed in the consuming project so oxlint can resolve the JS plugins from `node_modules`.

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

The Vue layer extends `base.json` internally — you only need to extend `vue.json`.

## Customising

Your `.oxlintrc.json` stub can override rules, add ignore patterns, add overrides, or add plugins on top of the shared layer.

### Overriding a rule

To change the severity or options of a rule defined in the shared layer, redeclare it in your stub — your value wins:

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

Overrides are additive — shared overrides (if any) still apply, and your local ones are appended:

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

Plugins are additive and deduplicated — your local plugins are added to the shared ones. Note that oxlint only supports its built-in plugin names (`oxc`, `typescript`, `unicorn`, `vue`, etc.) — there is no `playwright` or `vitest` plugin. Test-file-specific behaviour is handled via `overrides`, not plugins.

## Layers

| Layer | File | Contents |
|-------|------|----------|
| `base` | `base.json` | Correctness rules, `@stylistic` formatting rules, `vite-plus/prefer-vite-plus-imports`, `oxc` + `typescript` + `unicorn` plugins, browser env, node env for config files (`vite.config.*`, `vitest.config.*`, `playwright*.config.*`) |
| `vue` | `vue.json` | Extends `base`. Adds `vue` plugin, Vue compiler macros as globals, Vue-specific rules |

## What stays repo-local

- `ignorePatterns` — every repo has different build output and tool directories
- `overrides` for repo-specific directories (e.g. `bin/**/*.js`, `src/cli/**/*.js`, `src/playwright/**/*.js`) — the file paths differ per repo, so they can't be generalised
- Test-file rule relaxations (e.g. turning off `vite-plus/prefer-vite-plus-imports` in `*.d.ts`)
- Additional plugins — only repos that need them

## Merge semantics

When a consumer stub adds its own `rules` or `overrides` on top of a shared layer:

- **Rules** shallow-merge by key — the consumer's value wins for any rule defined in both
- **Overrides** are additive — both shared and local overrides apply
- **Plugins** are additive — both shared and local plugins are loaded (deduplicated)
