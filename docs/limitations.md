# Known limitations

## `env`, `globals`, and `ignorePatterns` don't merge through `extends`

Oxlint currently drops top-level `env`, `globals`, and `ignorePatterns` from an extended config file entirely: they only take effect if declared directly in the file Oxlint is invoked with. This is an open upstream bug: [oxc-project/oxc#20087](https://github.com/oxc-project/oxc/issues/20087) (open as of Oxlint 1.72.0).

In practice:

- `base.json`'s `env` (`builtin`, `browser`) and `vue.json`'s Vue macro `globals` (`defineProps`, `defineEmits`, etc.) won't reach a project that only does `{ "extends": ["./node_modules/@lewishowles/lint-config/vue.json"] }`. Every global from the shared layer gets flagged by `no-undef`.
- Any `ignorePatterns` this package might declare would be silently dropped the same way, so it deliberately ships none. See "What stays repo-local" in the README.

Until this is fixed upstream, redeclare the `env`/`globals` you need directly in your project's `.oxlintrc.json`, as shown in the README's usage examples, even though `base.json`/`vue.json` already declare them.

## Function-valued Vue macro options can produce two diagnostics

An undocumented function-valued option in `defineProps` or `defineEmits` reports both the matching `vue-prop-documentation` or `vue-emit-documentation` rule and `function-documentation`. One JSDoc block immediately before the option clears both, as long as it also carries the `@param`, `@returns`, and `@throws` tags that `function-documentation` requires for that function. This overlap is intentional because the rules remain independent.

## `vite-plus`'s `lint` config field requires resolved objects, not string paths

Raw Oxlint (CLI, editor integrations) accepts `"extends": ["./node_modules/@lewishowles/lint-config/vue.json"]` as string paths and resolves them at load time. `vite-plus`, when a project routes its Oxlint config through `vite.config.js`'s `lint` field (importing `.oxlintrc.json` as JSON and handing it to `vp check`/`vp lint`), doesn't resolve string paths in `extends`: every entry, at every nesting level, must already be a plain object. This means `vue.json`'s own internal `extends: ["./base.json"]` also breaks one level deeper.

If your project uses `vite-plus`'s `lint` field rather than raw Oxlint, resolve the chain yourself in `vite.config.js`:

```js
import base from "@lewishowles/lint-config/base.json" with { type: "json" };
import vue from "@lewishowles/lint-config/vue.json" with { type: "json" };

const lint = { ...vue, extends: [base] };
```

`vue`'s own `extends` array still contains the unresolved string `"./base.json"`, so don't spread it back in — replace it outright with the resolved `base` object.

`.oxlintrc.json` itself should stay untouched (string `extends`) for raw Oxlint/editor consumption; this only applies to the `vite-plus` config path.
