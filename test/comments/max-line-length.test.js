import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/max-line-length.js";

// The RuleTester instance used for every case below.
const ruleTester = new RuleTester();

ruleTester.run("comments/max-line-length", rule, {
	valid: [
		"const value = 1;",
		"// A short comment.",
		"// oxlint-disable-next-line comments/max-line-length comments/sentence-punctuation comments/jsdoc-tag-formatting\nconst value = 1;",
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
			name: "wraps an overlong standalone line comment",
			code: "// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 0 }],
			output:
				"// Explain how this dialog restores focus after it closes and returns to the\n// original trigger.\nopenDialog();",
		},
		{
			name: "wraps an overlong JSDoc prose line",
			code: `/**
 * Explain how this dialog restores focus after it closes and returns to the original trigger.
 */
function openDialog() {}`,
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 0 }],
			output: `/**
 * Explain how this dialog restores focus after it closes and returns to the
 * original trigger.
 */
function openDialog() {}`,
		},
		{
			name: "counts indentation and the line marker when wrapping",
			code: "\t// Explain how this dialog restores focus after it closes, then returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 1 }],
			output:
				"\t// Explain how this dialog restores focus after it closes, then returns to\n\t// the original trigger.\nopenDialog();",
		},
		{
			name: "wraps two-tab comments within 80 display columns",
			code: "\t\t// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 2 }],
			output:
				"\t\t// Explain how this dialog restores focus after it closes and returns to\n\t\t// the original trigger.\nopenDialog();",
		},
		{
			name: "reports a two-tab comment under 80 raw characters",
			code: "\t\t// Explain how this dialog restores focus after closing and returns to focus.\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 2 }],
			output:
				"\t\t// Explain how this dialog restores focus after closing and returns to\n\t\t// focus.\nopenDialog();",
		},
		{
			name: "reports an eight-space comment the same as the two-tab comment",
			code: "        // Explain how this dialog restores focus after closing and returns to focus.\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 8 }],
			output:
				"        // Explain how this dialog restores focus after closing and returns to\n        // focus.\nopenDialog();",
		},
		{
			name: "wraps an overlong ordinary block comment",
			code: "/* Explain how this dialog restores focus after it closes and returns to the original trigger. */\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 0 }],
			output:
				"/*\n * Explain how this dialog restores focus after it closes and returns to the\n * original trigger.\n */\nopenDialog();",
		},
	],
});
