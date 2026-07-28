import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/jsdoc-tag-formatting.js";

// The RuleTester instance used for every case below.
const ruleTester = new RuleTester();

ruleTester.run("comments/jsdoc-tag-formatting", rule, {
	valid: [
		"const value = 1;",
		{
			name: "leaves prose-to-tag spacing to the block-comment rule",
			code: `/**
 * Open the dialog.
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		{
			name: "keeps consecutive parameter tags together with aligned spacing",
			code: `/**
 * Move a tab to a new position.
 *
 * @param  {object}  tab
 *     The tab to move.
 * @param  {number}  index
 *     The destination index.
 */
function moveTab(tab, index) {}`,
		},
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
			name: "orders and aligns a complete tag set",
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
		{
			name: "normalises tag spacing without changing tag order",
			code: `/**
 * Find a tab by its ID.
 *
 * @param {string} id
 * The ID of the tab to find.
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
 */
function findTab(id) {}`,
		},
		{
			name: "groups consecutive parameters before returns",
			code: `/**
 * Move a tab to a new position.
 *
 * @param {object} tab
 *     The tab to move.
 *
 * @param {number} index
 *     The destination index.
 * @returns {object}
 *     The moved tab.
 */
function moveTab(tab, index) {}`,
			errors: [
				{
					message: "JSDoc tags must use the configured spacing, order, and grouping.",
					line: 1,
					column: 0,
				},
			],
			output: `/**
 * Move a tab to a new position.
 *
 * @param  {object}  tab
 *     The tab to move.
 * @param  {number}  index
 *     The destination index.
 *
 * @returns  {object}
 *     The moved tab.
 */
function moveTab(tab, index) {}`,
		},
	],
});
