import { RuleTester } from "vite-plus/lint/plugins-dev";

import rule from "#comments/rules/formatting.js";

// The RuleTester instance used for every case below.
const ruleTester = new RuleTester();

ruleTester.run("comments/formatting", rule, {
	valid: [
		"const value = 1;",
		"// A short comment.",
		"// `getValue`\ngetValue();",
		'// "one two"\nshowValue();',
		"// 😀 is ready.\nshowValue();",
		"// Available values:\nshowValue();",
		"// “one two”\nshowValue();",
		"/* 'one two' */\nshowValue();",
		"/* ‘one two’ */\nshowValue();",
		"/* Available values: */\nshowValue();",
		`/**
 * \`getValue\`
 */
function getValue() {}`,
		`/**
 * Read the value.
 *
 * @note Available values:
 */
function readValue() {}`,
		{
			name: "keeps a long code span inside one note sentence",
			code: `/**
 * Read the value.
 *
 * @note
 * See
 * \`an inline code span with several words that must remain together despite exceeding the available comment width\`
 * for details.
 */
function readValue() {}`,
		},
		{
			name: "keeps a wrapped code-led note line in its prose paragraph",
			code: `/**
 * Read the value.
 *
 * @note
 * Read the returned object when the request completes and use the value of
 * \`{ valid: true }\` when deciding whether to continue.
 */
function readValue() {}`,
		},
		{
			name: "keeps wrapped continuation lines aligned without refilling them",
			code: "// Close the dialog when focus moves outside the component and restore focus to\n// the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
		{
			name: "keeps an early line break in a line-comment group",
			code: "// Explain the dialog when opening\n// the panel.\nopenDialog();",
		},
		{
			name: "keeps sentence and list boundaries",
			code: "// Explain the dialog.\n// - First item\n// - Second item.\nopenDialog();",
		},
		{
			name: "keeps a hanging indent under a line-comment list item",
			code: "// - First item that\n//   continues on a hanging indent.\nopenDialog();",
		},
		{
			name: "keeps a hanging indent under a block-comment list item",
			code: `/*
 * - First item that
 *   continues on a hanging indent.
 */
openDialog();`,
		},
		{
			name: "keeps blank comment lines",
			code: "// Explain the dialog when opening\n//\n// the panel.\nopenDialog();",
		},
		{
			name: "treats comments separated by an ESLint directive as standalone",
			code: "// First comment.\n// eslint-disable-next-line comments/formatting\n// Second comment.\nconst value = 1;",
		},
		{
			name: "treats comments separated by an Oxlint directive as standalone",
			code: "// First comment.\n// oxlint-disable-next-line comments/formatting\n// Second comment.\nconst value = 1;",
		},
		{
			name: "treats comments separated by an Istanbul directive as standalone",
			code: "// First comment.\n// istanbul-ignore-next\n// Second comment.\nconst value = 1;",
		},
		{
			name: "treats comments separated by a c8 directive as standalone",
			code: "// First comment.\n// c8-ignore-next\n// Second comment.\nconst value = 1;",
		},
		"// oxlint-disable-next-line comments/formatting\nconst value = 1;",
		"/* oxlint-disable comments/formatting */",
		{
			name: "keeps every word in a formatted return description",
			code: `/**
 * Format the value.
 *
 * @returns  {string}
 *     The formatted value.
 */
function formatValue() {}`,
		},
		{
			name: "keeps every word in a formatted throw description",
			code: `/**
 * Read the value.
 *
 * @throws  {Error}
 *     The request failed.
 */
function readValue() {}`,
		},
		{
			name: "keeps a one-word return description",
			code: `/**
 * Check the value.
 *
 * @returns  {boolean}
 *     Ready.
 */
function checkValue() {}`,
		},
		{
			name: "leaves an empty parameter description empty after a hyphen",
			code: `/**
 * Explain the name.
 *
 * @param  {string}  name
 */
function explainName(name) {}`,
		},
		{
			name: "keeps canonical prose-to-tag spacing",
			code: `/**
 * Open the dialog.
 *
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		`/**
 * Open the dialog with the supplied options.
 */
function openDialog(options) {}`,
		{
			name: "keeps deliberate line breaks in tag-less JSDoc prose",
			code: `/**
 * Open the dialog.
 * Restore focus when it closes.
 */
function openDialog() {}`,
		},
		`/**
 * Convert a value.
 *
 * @example
 * convertValue({ value: "a very long example string that remains exactly as authored" })
 * ToCamelCase("already mixed")
 * openDialog({ restoreFocus: true })
 */
function convertValue(options) {}`,
		`/**
 * Open the dialog.
 *
 * The dialog restores focus to the original trigger when it closes.
 *
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
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
		{
			name: "keeps a leading line comment immediately before its declaration",
			code: "// Explain the value.\nconst value = 1;",
		},
		{
			name: "keeps a leading block comment immediately before its call",
			code: `/**
 * Register a dialog.
 */
registerDialog();`,
		},
		{
			name: "keeps a directive trailing comment in place",
			code: "const value = 1; // oxlint-disable-next-line comments/formatting",
		},
	],
	invalid: [
		{
			name: "keeps a heading in a note while formatting surrounding prose",
			code: `/**
 * Explain the options.
 *
 * @note
 * before the heading
 * #### \`required\`
 * after the heading
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @note
 * Before the heading.
 * #### \`required\`
 * After the heading.
 */
function explainOptions() {}`,
		},
		{
			name: "keeps a dash list item in a description",
			code: `/**
 * Explain the options.
 *
 * @description
 * before the list
 * - \`string\`: A string, including an empty string
 * after the list
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @description
 * Before the list.
 * - \`string\`: A string, including an empty string
 * After the list.
 */
function explainOptions() {}`,
		},
		{
			name: "keeps a star list item in a note",
			code: `/**
 * Explain the options.
 *
 * @note
 * before the list
 * * \`number\`: A number without NaN
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @note
 * Before the list.
 * * \`number\`: A number without NaN
 */
function explainOptions() {}`,
		},
		{
			name: "keeps a numbered list item in a parameter description",
			code: `/**
 * Explain the options.
 *
 * @param {object} options
 * 1. First item stays as written
 */
function explainOptions(options) {}`,
			errors: [{ message: "Format this comment." }],
			output: `/**
 * Explain the options.
 *
 * @param  {object}  options
 * 1. First item stays as written
 */
function explainOptions(options) {}`,
		},
		{
			name: "drops the hyphen and wraps an inline parameter description with a hanging indent",
			code: `/**
 * Explain the options.
 *
 * @param {string} name - description that stays prose even when the text extends
 * across another source line and must wrap under the tag with four spaces
 */
function explainOptions(name) {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @param  {string}  name
 *     Description that stays prose even when the text extends across another
 *     source line and must wrap under the tag with four spaces.
 */
function explainOptions(name) {}`,
		},
		{
			name: "keeps every word in an inline return description",
			code: `/**
 * Format the value.
 *
 * @returns {string} The formatted value
 */
function formatValue() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Format the value.
 *
 * @returns  {string}
 *     The formatted value.
 */
function formatValue() {}`,
		},
		{
			name: "keeps every word in an inline throw description",
			code: `/**
 * Read the value.
 *
 * @throws {Error} The request failed
 */
function readValue() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Read the value.
 *
 * @throws  {Error}
 *     The request failed.
 */
function readValue() {}`,
		},
		{
			name: "keeps a one-word inline return description",
			code: `/**
 * Check the value.
 *
 * @returns {boolean} ready
 */
function checkValue() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Check the value.
 *
 * @returns  {boolean}
 *     Ready.
 */
function checkValue() {}`,
		},
		{
			name: "drops a bare trailing hyphen from a parameter tag",
			code: `/**
 * Explain the name.
 *
 * @param {string} name -
 */
function explainName(name) {}`,
			errors: [{ message: "Format this comment." }],
			output: `/**
 * Explain the name.
 *
 * @param  {string}  name
 */
function explainName(name) {}`,
		},
		{
			name: "keeps a fenced block and blank lines in a parameter description",
			code: `/**
 * Explain the options.
 *
 * @param {object} options
 * before the code
 *
 * \`\`\`js
 * const value = 1;
 *
 * console.log(value);
 * \`\`\`
 * after the code
 */
function explainOptions(options) {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @param  {object}  options
 *     Before the code.
 *
 * \`\`\`js
 * const value = 1;
 *
 * console.log(value);
 * \`\`\`
 *     After the code.
 */
function explainOptions(options) {}`,
		},
		{
			name: "keeps an indented list continuation",
			code: `/**
 * Explain the options.
 *
 * @note
 * before the list
 * - First item
 *   continuation stays as written
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @note
 * Before the list.
 * - First item
 *   continuation stays as written
 */
function explainOptions() {}`,
		},
		{
			name: "keeps a Markdown table row",
			code: `/**
 * Explain the options.
 *
 * @note
 * before the table
 *
 * | Name | Value |
 * | --- | --- |
 * | One | two |
 * after the table
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @note
 * Before the table.
 *
 * | Name | Value |
 * | --- | --- |
 * | One | two |
 * After the table.
 */
function explainOptions() {}`,
		},
		{
			name: "keeps fenced code and its blank lines",
			code: `/**
 * Explain the options.
 *
 * @note
 * before the fence
 * \`\`\`js
 * const value = 1;
 *
 * console.log(value);
 * \`\`\`
 * after the fence
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Explain the options.
 *
 * @note
 * Before the fence.
 * \`\`\`js
 * const value = 1;
 *
 * console.log(value);
 * \`\`\`
 * After the fence.
 */
function explainOptions() {}`,
		},
		{
			name: "keeps Markdown in the leading description",
			code: `/**
 * before the heading
 * # Options
 * - Item stays as written
 * after the list
 *
 * @note Available values:
 */
function explainOptions() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Before the heading.
 * # Options
 * - Item stays as written
 * After the list.
 *
 * @note Available values:
 */
function explainOptions() {}`,
		},
		{
			name: "moves a trailing comment above a simple statement",
			code: "const value = 1; // Note.",
			errors: [{ message: "Line comments must be on their own line." }],
			output: "// Note.\nconst value = 1;",
		},
		{
			name: "moves a trailing comment above a middle line with its indentation",
			code: "const values = {\n\tfirst: 1,\n\tsecond: 2, // Note.\n\tthird: 3,\n};",
			errors: [{ message: "Line comments must be on their own line." }],
			output: "const values = {\n\tfirst: 1,\n\t// Note.\n\tsecond: 2,\n\tthird: 3,\n};",
		},
		{
			name: "moves a trailing comment above a class member with its indentation",
			code: "class A {\n\tvalue = 1; // Note.\n}",
			errors: [{ message: "Line comments must be on their own line." }],
			output: "class A {\n\t// Note.\n\tvalue = 1;\n}",
		},
		{
			name: "keeps an existing comment before the moved comment",
			code: "openDialog();\n// Explain the dialog.\ncloseDialog(); // Note.",
			errors: [{ message: "Line comments must be on their own line." }],
			output: "openDialog();\n// Explain the dialog.\n// Note.\ncloseDialog();",
		},
		{
			name: "formats a moved trailing comment in the same fix",
			code: "const value = 1; // explain the value",
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: "// Explain the value.\nconst value = 1;",
		},
		{
			name: "formats an existing and trailing comment in one run",
			code: "openDialog();\n// explain the dialog\ncloseDialog(); // note",
			errors: [
				{ message: "Comment text must be a complete sentence." },
				{ message: "Comment text must be a complete sentence." },
			],
			output: "openDialog();\n// Explain the dialog.\n// Note.\ncloseDialog();",
		},
		{
			name: "capitalises and punctuates a standalone line comment",
			code: "// close the dialog\ncloseDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: "// Close the dialog.\ncloseDialog();",
		},
		{
			name: "leaves a leading code span unchanged and punctuates following prose",
			code: "// `getValue` returns a result\ngetValue();",
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: "// `getValue` returns a result.\ngetValue();",
		},
		{
			name: "adds a full stop after a closing code span",
			code: "// Read `getValue`\ngetValue();",
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: "// Read `getValue`.\ngetValue();",
		},
		{
			name: "leaves a leading quote in a block comment unchanged",
			code: '/* "one two" explains the value */\nshowValue();',
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: '/* "one two" explains the value. */\nshowValue();',
		},
		{
			name: "leaves a leading emoji and following word unchanged",
			code: "// 😀 is ready\nshowValue();",
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: "// 😀 is ready.\nshowValue();",
		},
		{
			name: "keeps code inside JSDoc unchanged",
			code: `/**
 * \`getValue\` returns a result
 */
function getValue() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * \`getValue\` returns a result.
 */
function getValue() {}`,
		},
		{
			name: "adds a full stop after a closing quote in JSDoc",
			code: `/**
 * Read "one two"
 */
function readValue() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Read "one two".
 */
function readValue() {}`,
		},
		{
			name: "capitalises a wrapped line comment without moving words",
			code: "// close the dialog when focus moves outside the component\n// and restore focus to the original trigger.\nonClickOutside(dialog, closeDialog);",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output:
				"// Close the dialog when focus moves outside the component\n// and restore focus to the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
		{
			name: "wraps only the overlong middle line in a line-comment group",
			code: "// explain the dialog\n// This middle line explains how the dialog restores focus after it closes and returns to the original trigger\n// then continue\nopenDialog();",
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output:
				"// Explain the dialog\n// This middle line explains how the dialog restores focus after it closes and\n// returns to the original trigger\n// then continue.\nopenDialog();",
		},
		{
			name: "formats comments separated by an ESLint directive independently",
			code: "// first comment\n// eslint-disable-next-line comments/formatting\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output:
				"// First comment.\n// eslint-disable-next-line comments/formatting\n// Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by an Oxlint directive independently",
			code: "// first comment\n// oxlint-disable-next-line comments/formatting\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output:
				"// First comment.\n// oxlint-disable-next-line comments/formatting\n// Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by an Istanbul directive independently",
			code: "// first comment\n// istanbul-ignore-next\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output: "// First comment.\n// istanbul-ignore-next\n// Second comment.\nconst value = 1;",
		},
		{
			name: "formats comments separated by a c8 directive independently",
			code: "// first comment\n// c8-ignore-next\n  // second comment\nconst value = 1;",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 0 },
				{ message: "Comment text must be a complete sentence.", line: 3, column: 2 },
			],
			output: "// First comment.\n// c8-ignore-next\n// Second comment.\nconst value = 1;",
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
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		{
			name: "wraps description text at the comment margin in one fix",
			code: `/**
 * Explain the dialog.
 *
 * @description
 *     Describe how the dialog restores focus to its trigger after closing and keeps the selected tab available.
 */
function openDialog() {}`,
			errors: [{ message: "Format this comment." }],
			output: `/**
 * Explain the dialog.
 *
 * @description
 * Describe how the dialog restores focus to its trigger after closing and keeps
 * the selected tab available.
 */
function openDialog() {}`,
		},
		{
			name: "wraps note text at the comment margin in one fix",
			code: `/**
 * Explain the dialog.
 *
 * @note
 *     Note that the dialog restores focus to its trigger after closing and keeps the selected tab available.
 */
function openDialog() {}`,
			errors: [{ message: "Format this comment." }],
			output: `/**
 * Explain the dialog.
 *
 * @note
 * Note that the dialog restores focus to its trigger after closing and keeps
 * the selected tab available.
 */
function openDialog() {}`,
		},
		{
			name: "keeps the parameter indent but wraps mixed note text at the margin in one fix",
			code: `/**
 * Open the dialog.
 *
 * @param {object} options
 *     The options determine how the dialog restores focus to its trigger after closing and keeps the selected tab available.
 * @note
 *     Note that the dialog restores focus to its trigger after closing and keeps the selected tab available.
 */
function openDialog(options) {}`,
			errors: [{ message: "Format this comment." }],
			output: `/**
 * Open the dialog.
 *
 * @param  {object}  options
 *     The options determine how the dialog restores focus to its trigger after
 *     closing and keeps the selected tab available.
 * @note
 * Note that the dialog restores focus to its trigger after closing and keeps
 * the selected tab available.
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
			name: "refills early-wrapped ordinary block prose",
			code: `/*
 * Explain the dialog when opening
 * the panel.
 */
openDialog();`,
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output: `/*
 * Explain the dialog when opening the panel.
 */
openDialog();`,
		},
		{
			name: "refills early-wrapped JSDoc prose",
			code: `/**
 * Explain the dialog when opening
 * the panel.
 */
function openDialog() {}`,
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output: `/**
 * Explain the dialog when opening the panel.
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
			code: "\t// Close the dialog when focus moves outside the component and restore focus\n  // to the original trigger.\n\tonClickOutside(dialog, closeDialog);",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Close the dialog when focus moves outside the component and restore focus\n\t// to the original trigger.\n\tonClickOutside(dialog, closeDialog);",
		},
		{
			name: "adds the leading indentation to an unindented continuation line",
			code: "\t// Close the dialog when focus moves outside the component and restore focus\n// to the original trigger.\n\tonClickOutside(dialog, closeDialog);",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Close the dialog when focus moves outside the component and restore focus\n\t// to the original trigger.\n\tonClickOutside(dialog, closeDialog);",
		},
		{
			name: "wraps an overlong standalone line comment",
			code: "// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output:
				"// Explain how this dialog restores focus after it closes and returns to the\n// original trigger.\nopenDialog();",
		},
		{
			name: "keeps an overlong inline code span whole on its own line",
			code: "// Read `an inline code span with several words that must remain together despite exceeding the available comment width` now.\nreadValue();",
			errors: [{ message: "Format this comment." }],
			output:
				"// Read\n// `an inline code span with several words that must remain together despite exceeding the available comment width`\n// now.\nreadValue();",
		},
		{
			name: "keeps an overlong inline code span whole in a block comment",
			code: `/*
 * Read \`an inline code span with several words that must remain together despite exceeding the available comment width\` now and later
 */
readValue();`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/*
 * Read
 * \`an inline code span with several words that must remain together despite exceeding the available comment width\`
 * now and later.
 */
readValue();`,
		},
		{
			name: "keeps an overlong inline code span whole in JSDoc prose",
			code: `/**
 * Read \`an inline code span with several words that must remain together despite exceeding the available comment width\` now and later
 *
 * @note Available values:
 */
function readValue() {}`,
			errors: [{ message: "Comment text must be a complete sentence." }],
			output: `/**
 * Read
 * \`an inline code span with several words that must remain together despite exceeding the available comment width\`
 * now and later.
 *
 * @note Available values:
 */
function readValue() {}`,
		},
		{
			name: "wraps a standalone comment after a trailing comment",
			code: "run(); // note\n// Explain how this dialog restores focus after it closes and returns to the original trigger.\nopenDialog();",
			errors: [
				{ message: "Comment text must be a complete sentence.", line: 1, column: 7 },
				{ message: "Format this comment.", line: 2, column: 0 },
			],
			output:
				"// Note.\nrun();\n// Explain how this dialog restores focus after it closes and returns to the\n// original trigger.\nopenDialog();",
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
			code: "\t// Explain how this dialog restores focus after it closes, then returns to the original trigger.\n\topenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Explain how this dialog restores focus after it closes, then returns to\n\t// the original trigger.\n\topenDialog();",
		},
		{
			name: "wraps two-tab comments within 80 display columns",
			code: "\t\t// Explain how this dialog restores focus after it closes and returns to the original trigger.\n\t\topenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 2 }],
			output:
				"\t\t// Explain how this dialog restores focus after it closes and returns to\n\t\t// the original trigger.\n\t\topenDialog();",
		},
		{
			name: "reports a two-tab comment under 80 raw characters",
			code: "\t\t// Explain how this dialog restores focus after closing and returns to focus.\n\t\topenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 2 }],
			output:
				"\t\t// Explain how this dialog restores focus after closing and returns to\n\t\t// focus.\n\t\topenDialog();",
		},
		{
			name: "reports an eight-space comment the same as the two-tab comment",
			code: "        // Explain how this dialog restores focus after closing and returns to focus.\n        openDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 8 }],
			output:
				"        // Explain how this dialog restores focus after closing and returns to\n        // focus.\n        openDialog();",
		},
		{
			name: "wraps an overlong ordinary block comment",
			code: "/* Explain how this dialog restores focus after it closes and returns to the original trigger. */\nopenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output:
				"/*\n * Explain how this dialog restores focus after it closes and returns to the\n * original trigger.\n */\nopenDialog();",
		},
		{
			name: "wraps a block comment against its new indentation in one pass",
			code: "/* Explain how dialog focus returns to its trigger after closing the dialog. */\n\t\topenDialog();",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 0 },
			],
			output:
				"\t\t/*\n\t\t * Explain how dialog focus returns to its trigger after closing the\n\t\t * dialog.\n\t\t */\n\t\topenDialog();",
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
			code: "\t// Explain how this dialog restores focus after it closes and returns to the original trigger.\n  // Keep focus on the original trigger.\n\topenDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output:
				"\t// Explain how this dialog restores focus after it closes and returns to the\n\t// original trigger.\n\t// Keep focus on the original trigger.\n\topenDialog();",
		},
		{
			name: "adds a blank line before the first JSDoc tag",
			code: `/**
 * Open the dialog.
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output: `/**
 * Open the dialog.
 *
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		{
			name: "normalises JSDoc block structure, tags, and punctuation in one fix",
			code: `/** Open the dialog.
 *
 * The dialog restores focus to the original trigger when it closes.
 * @param {object} options
 * The dialog options
 */
function openDialog(options) {}`,
			errors: [{ message: "Comment text must be a complete sentence.", line: 1, column: 0 }],
			output: `/**
 * Open the dialog.
 *
 * The dialog restores focus to the original trigger when it closes.
 *
 * @param  {object}  options
 *     The dialog options.
 */
function openDialog(options) {}`,
		},
		{
			name: "expands a one-line JSDoc comment",
			code: "/** Register the dialog. */\nregisterDialog();",
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
			output: `/**
 * Register the dialog.
 */
registerDialog();`,
		},
		{
			name: "orders and aligns a complete JSDoc tag set",
			code: `/**
 * Find a tab by its ID.
 *
 * @returns {object|null}
 *     The matching tab, or null when none exists.
 * @param {string} id
 *     The ID of the tab to find.
 */
function findTab(id) {}`,
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
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
			name: "normalises JSDoc tag spacing without changing tag order",
			code: `/**
 * Find a tab by its ID.
 *
 * @param {string} id
 * The ID of the tab to find.
 */
function findTab(id) {}`,
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
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
			errors: [{ message: "Format this comment.", line: 1, column: 0 }],
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
		{
			name: "wraps tab-indented tag descriptions within 80 display columns",
			code: `\t/**
\t * Open the dialog.
\t *
\t * @param  {object}  options
\t *     Explain how this modal restores focus after it closes and returns to the original trigger.
\t */
\tfunction openDialog(options) {}`,
			errors: [{ message: "Format this comment.", line: 1, column: 1 }],
			output: `\t/**
\t * Open the dialog.
\t *
\t * @param  {object}  options
\t *     Explain how this modal restores focus after it closes and returns to
\t *     the original trigger.
\t */
\tfunction openDialog(options) {}`,
		},
		{
			name: "removes a blank line before a declaration comment",
			code: "  // Explain the value.\n\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 2 },
			],
			output: "// Explain the value.\nconst value = 1;",
		},
		{
			name: "removes a blank line before a directive after a block comment",
			code: "/* Explain the value. */\n\n// oxlint-disable-next-line comments/variable-declarations\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 0 },
			],
			output:
				"/* Explain the value. */\n// oxlint-disable-next-line comments/variable-declarations\nconst value = 1;",
		},
		{
			name: "reindents a directive that separates a comment from its code",
			code: "if (isReady) {\n\t// Explain the value.\n  // oxlint-disable-next-line comments/variable-declarations\n\trunTask();\n}",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 2, column: 1 },
			],
			output:
				"if (isReady) {\n\t// Explain the value.\n\t// oxlint-disable-next-line comments/variable-declarations\n\trunTask();\n}",
		},
		{
			name: "matches block-comment indentation to its declaration",
			code: "\t/**\n\t * Explain the value.\n\t */\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 1 },
			],
			output: "/**\n * Explain the value.\n */\nconst value = 1;",
		},
		{
			name: "reindents a leading block comment once inside an indented block",
			code: "if (isReady) {\n/**\n * Explain the value.\n */\n\trunTask();\n}",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 2, column: 0 },
			],
			output: "if (isReady) {\n\t/**\n\t * Explain the value.\n\t */\n\trunTask();\n}",
		},
		{
			name: "ignores directives when finding a continuation-comment leader",
			code: "// oxlint-disable-next-line comments/formatting\n\t// Explain the value across two lines and\n\t// continue on the second line.\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 2, column: 1 },
			],
			output:
				"// oxlint-disable-next-line comments/formatting\n// Explain the value across two lines and\n// continue on the second line.\nconst value = 1;",
		},
		{
			name: "does not treat comments separated by a directive as continuations",
			code: "if (isReady) {\n\t// First comment.\n\t// oxlint-disable-next-line comments/formatting\n  // Second comment.\n\trunTask();\n}",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 4, column: 2 },
			],
			output:
				"if (isReady) {\n\t// First comment.\n\t// oxlint-disable-next-line comments/formatting\n\t// Second comment.\n\trunTask();\n}",
		},
		{
			name: "reindents a wrapped continuation comment without refilling it",
			code: "\t// Explain the value across two lines and\n\t// continue on the second line.\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 1 },
			],
			output:
				"// Explain the value across two lines and\n// continue on the second line.\nconst value = 1;",
		},
	],
});
