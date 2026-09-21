# Changelog

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
