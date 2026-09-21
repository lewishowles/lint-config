# Changelog

## Unreleased

### Changes

- `comments/formatting` now moves trailing line comments onto their own line.

## 0.5.0: 2026-09-11

### Changes

- Breaking: replace `comments/line-comments` and `comments/max-line-length` with `comments/formatting`.
- Breaking: fold `comments/sentence-punctuation` into `comments/formatting`.
- Breaking: fold `comments/block-comments` and `comments/jsdoc-tag-formatting` into `comments/formatting`.
- Breaking: fold `comments/placement` into `comments/formatting`.
- `comments/variable-declarations`: add a `rootOnly` option; `comments.json` enables it for test files so only root-level variables need comments there. If you override `comments.json` rules, concatenate the test-file override (see README).

### Fixes

- Measure comment width in display columns, with tabs counted as four, so indented comments wrap and validate against the visible 80-column limit.
- Refill comment lines that were wrapped before the 80-column limit.
- `comments/variable-declarations`: skip the line-comment requirement for `const` declarations assigned to arrow functions or function expressions.

## 0.4.0: 2026-08-28

### New rules

- Added `comments/class-documentation`: requires a block comment on class declarations and const-assigned class expressions, JSDoc on constructors and ordinary methods, return-aware JSDoc on getters and setters, and line comments on instance and static fields. Ships in the opt-in `comments.json` layer.

### Fixes

- A directive comment (`eslint-`, `oxlint-`, and similar) sitting between a doc comment and its code is now reported, instead of the doc being treated as attached to the code.
- Documentation placed before an exported declaration is now recognised.
- `using` and `await using` declarations now require a preceding line comment, like `const` and `let`.

Earlier versions predate this changelog; see the git history for their changes.
