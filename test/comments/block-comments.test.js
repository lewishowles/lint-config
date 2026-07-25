import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/block-comments.js";

const ruleTester = new RuleTester();

ruleTester.run("comments/block-comments", rule, {
	valid: [
		"const value = 1;",
		`/**
 * Open the dialog.
 *
 * The dialog restores focus to the original trigger when it closes.
 *
 * @param  {object}  options
 *     The dialog options.
 */
	function openDialog(options) {}`,
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
			code: `/** Open the dialog.
 *
 * The dialog restores focus to the original trigger when it closes.
 * @param {object} options
 * The dialog options.
 */
function openDialog(options) {}`,
			errors: [
				{ message: "JSDoc comments must use the configured block format.", line: 1, column: 0 },
			],
			output: `/**
 * Open the dialog.
 *
 * The dialog restores focus to the original trigger when it closes.
 *
 * @param {object} options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
	],
});
