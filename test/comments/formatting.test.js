import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/formatting.js";

// The RuleTester instance used for every case below.
const ruleTester = new RuleTester();

ruleTester.run("comments/formatting", rule, {
	valid: [
		"const value = 1;",
		"// A short comment.",
		{
			name: "keeps a short standalone comment after a trailing comment",
			code: "run(); // note\n// A short standalone comment.\nopenDialog();",
		},
		{
			name: "keeps wrapped continuation lines aligned",
			code: "// Close the dialog when focus moves outside the component and restore focus\n// to the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
		{
			name: "treats comments separated by an ESLint directive as standalone",
			code: "// First comment.\n// eslint-disable-next-line comments/formatting\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "treats comments separated by an Oxlint directive as standalone",
			code: "// First comment.\n// oxlint-disable-next-line comments/formatting\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "treats comments separated by an Istanbul directive as standalone",
			code: "// First comment.\n// istanbul-ignore-next\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "treats comments separated by a c8 directive as standalone",
			code: "// First comment.\n// c8-ignore-next\n  // Second comment.\nconst value = 1;",
		},
		"// oxlint-disable-next-line comments/formatting\nconst value = 1;",
		"/* oxlint-disable comments/formatting */",
		{
			name: "leaves prose-to-tag spacing to the block-comment rule",
			code: `/**
 * Open the dialog.
 * @param {object} options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		`/**
 * Open the dialog with the supplied options.
 */
	function openDialog(options) {}`,
		`/**
 * Convert a value.
 *
 * @example
 * convertValue({ value: "a very long example string that remains exactly as authored" })
 * ToCamelCase("already mixed")
 * openDialog({ restoreFocus: true })
 */
function convertValue(options) {}`,
	],
	invalid: [
		{
			name: "capitalises and punctuates a standalone line comment",
			code: "// close the dialog\ncloseDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: "// Close the dialog.\ncloseDialog();",
		},
		{
			name: "formats a wrapped line comment as one sentence",
			code: "// close the dialog when focus moves outside the component\n// and restore focus to the original trigger.\nonClickOutside(dialog, closeDialog);",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output:
				"// Close the dialog when focus moves outside the component\n// and restore focus to the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
		{
			name: "formats comments separated by an ESLint directive independently",
			code: "// first comment\n// eslint-disable-next-line comments/formatting\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output:
				"// First comment.\n// eslint-disable-next-line comments/formatting\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by an Oxlint directive independently",
			code: "// first comment\n// oxlint-disable-next-line comments/formatting\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output:
				"// First comment.\n// oxlint-disable-next-line comments/formatting\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by an Istanbul directive independently",
			code: "// first comment\n// istanbul-ignore-next\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output: "// First comment.\n// istanbul-ignore-next\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by a c8 directive independently",
			code: "// first comment\n// c8-ignore-next\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output: "// First comment.\n// c8-ignore-next\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "formats multiline ordinary block-comment prose",
			code: `/* close the dialog
 * after focus moves outside the component
 */
closeDialog();`,
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: `/*
 * Close the dialog after focus moves outside the component.
 */
closeDialog();`,
		},
		{
			name: "formats JSDoc prose and tag descriptions",
			code: `/**
 * open the dialog
 *
 * @param {object} options
 *     the dialog options
 */
function openDialog(options) {}`,
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: `/**
 * Open the dialog.
 *
 * @param {object} options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		{
			name: "preserves wrapped JSDoc prose while adding punctuation",
			code: `/**
 * Explain how this dialog restores focus after it closes and returns to the
 * original trigger
 */
function openDialog() {}`,
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: `/**
 * Explain how this dialog restores focus after it closes and returns to the
 * original trigger.
 */
function openDialog() {}`,
		},
		{
			name: "formats an inline ordinary block comment",
			code: "/* close the dialog */\ncloseDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: "/* Close the dialog. */\ncloseDialog();",
		},
		{
			name: "adds punctuation without capitalising a leading camelCase identifier",
			code: "// closeDialog runs when focus moves outside the component\ncloseDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: "// closeDialog runs when focus moves outside the component.\ncloseDialog();",
		},
		{
			name: "aligns a continuation line with the first marker",
			code: "\t// Close the dialog when focus moves outside the component and restore focus\n  // to the original trigger.\nonClickOutside(dialog, closeDialog);",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Close the dialog when focus moves outside the component and restore focus\n\t// to the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
		{
			name: "adds the leading indentation to an unindented continuation line",
			code: "\t// Close the dialog when focus moves outside the component and restore focus\n// to the original trigger.\nonClickOutside(dialog, closeDialog);",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Close the dialog when focus moves outside the component and restore focus\n\t// to the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
		{
			name: "wraps an overlong standalone line comment",
			code: "// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output:
				"// Explain how this dialog restores focus after it closes and returns to the\n// original trigger.\nopenDialog();",
		},
		{
			name: "wraps a standalone comment after a trailing comment",
			code: "run(); // note\n// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 2, column: 0 }],
			output:
				"run(); // note\n// Explain how this dialog restores focus after it closes and returns to the\n// original trigger.\nopenDialog();",
		},
		{
			name: "wraps an overlong JSDoc prose line",
			code: `/**
 * Explain how this dialog restores focus after it closes and returns to the original trigger.
 */
function openDialog() {}`,
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output: `/**
 * Explain how this dialog restores focus after it closes and returns to the
 * original trigger.
 */
function openDialog() {}`,
		},
		{
			name: "counts indentation and the line marker when wrapping",
			code: "\t// Explain how this dialog restores focus after it closes, then returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Explain how this dialog restores focus after it closes, then returns to\n\t// the original trigger.\nopenDialog();",
		},
		{
			name: "wraps two-tab comments within 80 display columns",
			code: "\t\t// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 2 }],
			output:
				"\t\t// Explain how this dialog restores focus after it closes and returns to\n\t\t// the original trigger.\nopenDialog();",
		},
		{
			name: "reports a two-tab comment under 80 raw characters",
			code: "\t\t// Explain how this dialog restores focus after closing and returns to focus.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 2 }],
			output:
				"\t\t// Explain how this dialog restores focus after closing and returns to\n\t\t// focus.\nopenDialog();",
		},
		{
			name: "reports an eight-space comment the same as the two-tab comment",
			code: "        // Explain how this dialog restores focus after closing and returns to focus.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 8 }],
			output:
				"        // Explain how this dialog restores focus after closing and returns to\n        // focus.\nopenDialog();",
		},
		{
			name: "wraps an overlong ordinary block comment",
			code: "/* Explain how this dialog restores focus after it closes and returns to the original trigger. */\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output:
				"/*\n * Explain how this dialog restores focus after it closes and returns to the\n * original trigger.\n */\nopenDialog();",
		},
		{
			name: "wraps and punctuates a canonical multiline block comment in one fix",
			code: `/*
 * Explain how this dialog restores focus after it closes and returns to the
 * original trigger because this final line is deliberately too long and lacks terminal punctuation
 */
openDialog();`,
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: `/*
 * Explain how this dialog restores focus after it closes and returns to the
 * original trigger because this final line is deliberately too long and lacks
 * terminal punctuation.
 */
openDialog();`,
		},
		{
			name: "combines line-comment reindentation and wrapping in one fix",
			code: "\t// Explain how this dialog restores focus after it closes and returns to the original trigger.\n  // Keep focus on the original trigger.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Explain how this dialog restores focus after it closes and returns to the\n\t// original trigger.\n\t// Keep focus on the original trigger.\nopenDialog();",
		},
	],
});
