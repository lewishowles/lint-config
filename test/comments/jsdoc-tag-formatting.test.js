import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/jsdoc-tag-formatting.js";

const ruleTester = new RuleTester();

ruleTester.run("comments/jsdoc-tag-formatting", rule, {
	valid: [
		"const value = 1;",
		`/**
 * Find a tab by its ID.
 *
 * @param  {string}  id
 *     The ID of the tab to find.
 *
 * @throws  {TypeError}
 *     Thrown when the ID is invalid.
 *
 * @returns  {object|null}
 *     The matching tab, or null when none exists.
 */
	function findTab(id) {}`,
		`/**
 * Find a tab by its ID.
 *
 * @param  {string}  id
 *     The ID of the tab to find.
 *
 * @example
 * toCamelCase("hello world")
 * ToCamelCase("already mixed")
 * openDialog({ restoreFocus: true })
 *
 * @returns  {string}
 *     The converted tab ID.
 */
function findTab(id) {}`,
	],
	invalid: [
		{
			code: `/**
 * Find a tab by its ID.
 *
 * @returns {object|null}
 *     The matching tab, or null when none exists.
 * @param {string} id
 *     The ID of the tab to find.
 */
function findTab(id) {}`,
			errors: [
				{
					message: "JSDoc tags must use the configured spacing, order, and grouping.",
					line: 1,
					column: 0,
				},
			],
			output: `/**
 * Find a tab by its ID.
 *
 * @param  {string}  id
 *     The ID of the tab to find.
 *
 * @returns  {object|null}
 *     The matching tab, or null when none exists.
 */
function findTab(id) {}`,
		},
	],
});
