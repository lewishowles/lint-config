import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/max-line-length.js";

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
			code: "// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Comment exceeds 80 characters.", line: 1, column: 0 }],
			output:
				"// Explain how this dialog restores focus after it closes and returns to the\n// original trigger.\nopenDialog();",
		},
		{
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
	],
});
