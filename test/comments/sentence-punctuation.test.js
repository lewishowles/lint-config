import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/sentence-punctuation.js";

const ruleTester = new RuleTester();

ruleTester.run("comments/sentence-punctuation", rule, {
	valid: [
		"const value = 1;",
		"// Close the dialog.",
		"// oxlint-disable-next-line comments/max-line-length\nconst value = 1;",
		"/* oxlint-disable comments/sentence-punctuation */",
		`/**
 * Open the dialog.
 */
	function openDialog() {}`,
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
 * Open the dialog.
 *
 * @param {object} options
 *     The dialog options.
 *
 * @example
 * toCamelCase("hello world")
 * ToCamelCase("already mixed")
 * openDialog({ restoreFocus: true })
 */
function openDialog(options) {}`,
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
			code: "// first comment\n// eslint-disable-next-line comments/line-comments\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output:
				"// First comment.\n// eslint-disable-next-line comments/line-comments\n  // Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by an Oxlint directive independently",
			code: "// first comment\n// oxlint-disable-next-line comments/line-comments\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output:
				"// First comment.\n// oxlint-disable-next-line comments/line-comments\n  // Second comment.\nconst value = 1;",
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
	],
});
