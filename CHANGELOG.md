# Changelog

## 0.8.0: 2026-10-05

### Changes

- Breaking: `vite-plus` 1.0.0 is now required. Put the selected lint layers in a `vite.config.js` `lint` block; `vp check` and `vp lint` ignore a `.oxlintrc.json` on its own. Use `lintConfig` from `@lewishowles/lint-config/layers` to build the block, with an optional `.oxlintrc.json` for local settings. Vite+ 1.0 also adds its own `vite-plus/prefer-vite-plus-imports` rule, which may report new problems after upgrading.
- New `./layers` export provides `base`, `vue`, `comments`, and `lintConfig`. The Vue layer includes base, and `lintConfig` carries inherited environments and globals into the Vite+ lint block.
- `comments/function-documentation` adds an `ignoreInlineArrows` option, enabled by `comments.json` for test files. Arrow functions used as object property values no longer need JSDoc there; other function forms and files keep their existing requirements.
- `comments/formatting` changes the output of `--fix` for comments. Run `--fix` once after upgrading.

### Fixes

- `comments/formatting` keeps code spans, quotes, colons, Markdown blocks, and descriptions in mixed-tag JSDoc blocks as written. It places free-form tag text at the comment margin, removes a separator hyphen when a tag description moves onto its own line, keeps wrapped parameter, return, and throw descriptions indented, and preserves line breaks between adjacent `//` comments.
- The documentation rules for functions, variables, configured API calls and classes recognise comments across tool directives such as `eslint-disable-next-line`. `comments/function-documentation` accepts plain or optional JSDoc names for destructured parameters with defaults.

## 0.7.0: 2026-09-30

### Changes

- Breaking: `base` now reports an error for imports that reach into a parent folder, such as `../utils`. Use the package's subpath imports or an alias instead; `--fix` can't rewrite these.
- Breaking: `base` now expects a blank line before an `await` statement that follows other code, and around `const` declarations that span several lines. Run `--fix` once to update existing code.
- New opt-in `imports.json` layer with formatter settings that sort imports. See the README for how to add it.

## 0.6.1: 2026-09-21

### Fixes

- `comments/function-documentation`: accept the name the JSDoc gives a destructured object parameter, instead of always expecting `options`.

## 0.6.0: 2026-09-21

### Changes

- Breaking: replace `comments/line-comments`, `comments/max-line-length`, `comments/sentence-punctuation`, `comments/block-comments`, `comments/jsdoc-tag-formatting`, and `comments/placement` with a single `comments/formatting` rule. Remove the old rule IDs from your configuration; `comments.json` already enables `comments/formatting`.
- Breaking: `base` now reports an error when statements of different kinds, such as a declaration followed by a function call, have no blank line between them, and when consecutive `const` or `let` declarations are separated by a blank line. Run `--fix` once to update existing code.
- `comments/formatting` moves trailing line comments onto their own line above the code.

### Fixes

- `comments/formatting`: refill comment lines that were wrapped before the 80-column limit.
- `comments/variable-declarations`: skip the line-comment requirement for `const` declarations assigned to arrow functions or function expressions.

## 0.5.0: 2026-09-11

### Changes

- `comments/variable-declarations`: add a `rootOnly` option; `comments.json` enables it for test files so only root-level variables need comments there. If you override `comments.json` rules, concatenate the test-file override (see README).

### Fixes

- Measure comment width in display columns, with tabs counted as four, so indented comments wrap and validate against the visible 80-column limit.

## 0.4.0: 2026-08-28

### New rules

- Added `comments/class-documentation`: requires a block comment on class declarations and const-assigned class expressions, JSDoc on constructors and ordinary methods, return-aware JSDoc on getters and setters, and line comments on instance and static fields. Ships in the opt-in `comments.json` layer.

### Fixes

- A directive comment (`eslint-`, `oxlint-`, and similar) sitting between a doc comment and its code is now reported, instead of the doc being treated as attached to the code.
- Documentation placed before an exported declaration is now recognised.
- `using` and `await using` declarations now require a preceding line comment, like `const` and `let`.

Earlier versions predate this changelog; see the git history for their changes.
