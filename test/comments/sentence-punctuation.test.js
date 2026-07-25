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
			code: "// close the dialog\ncloseDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: "// Close the dialog.\ncloseDialog();",
		},
		{
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
			code: "/* close the dialog */\ncloseDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: "/* Close the dialog. */\ncloseDialog();",
		},
	],
});
