import { RuleTester } from "vite-plus/lint/plugins-dev";

import rule from "#testing/rules/no-text-lookups.js";

// The test runner for the text lookup rule.
const ruleTester = new RuleTester();

// The error expected for each lookup by visible text.
const lookupError = {
	message: "Find test elements by a data-test attribute instead of visible text.",
};

ruleTester.run("testing/no-text-lookups", rule, {
	valid: [
		{
			name: "finds an element by its data-test attribute",
			code: "wrapper.find('[data-test=item]');",
		},
		{
			name: "finds one of several elements by its data-test attribute",
			code: "wrapper.findAll('[data-test=item]').find(item => item.attributes('data-test') === 'item');",
		},
		{
			name: "asserts the text of an element already found",
			code: "expect(wrapper.find('[data-test=item]').text()).toBe('Save');",
		},
		{ name: "allows a callback passed by name", code: "items.find(hasLabel);" },
		{
			name: "allows array searches over data without text reads",
			code: "items.filter(item => item.id === selectedId); items.some(item => item.active);",
		},
		{
			name: "allows a text property on plain data",
			code: "items.find(item => item.text === selectedText);",
		},
		{
			name: "allows a text read outside a search callback",
			code: "const label = item.text(); items.find(item => item.id === label);",
		},
	],
	invalid: [
		{
			name: "reports filter callbacks that call text",
			code: "items.filter(item => item.text().includes('Save'));",
			errors: [lookupError],
		},
		{
			name: "reports find callbacks that read textContent",
			code: "items.find(item => item.textContent === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports findLast callbacks that read innerText",
			code: "items.findLast(item => item.innerText === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports findIndex callbacks that read element textContent",
			code: "items.findIndex(item => item.element.textContent === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports findLastIndex callbacks that read element innerText",
			code: "items.findLastIndex(item => item.element.innerText === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports some callbacks that call text",
			code: "items.some(item => item.text() === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports every callbacks that call text",
			code: "items.every(item => item.text() === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports block-bodied callbacks that read text",
			code: "items.find(item => { const label = item.text(); return label === 'Save'; });",
			errors: [lookupError],
		},
		{
			name: "reports function callbacks that read text",
			code: "items.find(function (item) { return item.text() === 'Save'; });",
			errors: [lookupError],
		},
		{
			name: "reports lookups against a variable holding found elements",
			code: "const items = wrapper.findAll('li'); items.find(item => item.text() === 'Save');",
			errors: [lookupError],
		},
		{
			name: "reports a nested array search only at the inner call",
			code: "rows.find(row => row.findAll('td').some(cell => cell.text() === 'Lewis'));",
			errors: [{ ...lookupError, column: 17 }],
		},
		{
			name: "reports text read by a nested map callback at the outer search",
			code: "items.find(item => item.findAll('td').map(cell => cell.text()).includes('Lewis'));",
			errors: [{ ...lookupError, column: 0 }],
		},
	],
});
