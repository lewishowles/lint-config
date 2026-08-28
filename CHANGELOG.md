# Changelog

## 0.4.0: 2026-08-28

### New rules

- Added `comments/class-documentation`: requires a block comment on class declarations and const-assigned class expressions, JSDoc on constructors and ordinary methods, return-aware JSDoc on getters and setters, and line comments on instance and static fields. Ships in the opt-in `comments.json` layer.

### Fixes

- A directive comment (`eslint-`, `oxlint-`, and similar) sitting between a doc comment and its code is now reported, instead of the doc being treated as attached to the code.
- Documentation placed before an exported declaration is now recognised.
- `using` and `await using` declarations now require a preceding line comment, like `const` and `let`.

Earlier versions predate this changelog; see the git history for their changes.
