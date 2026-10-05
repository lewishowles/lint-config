import { RuleTester } from "vite-plus/lint/plugins-dev";

import rule from "#comments/rules/function-documentation.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/function-documentation", rule, {
	valid: [
		"/** Open the dialog. */\nfunction openDialog() {}",
		{
			name: "accepts JSDoc before an ESLint directive",
			code: "/** Open the dialog. */\n// eslint-disable-next-line no-empty\nfunction openDialog() {}",
		},
		{
			name: "accepts JSDoc before an Oxlint directive",
			code: "/** Open the dialog. */\n// oxlint-disable-next-line no-empty\nfunction openDialog() {}",
		},
		"/** Open the dialog.\n *\n * @param {string} id\n * @returns {string}\n * @throws {Error}\n */\nexport function openDialog(id) { if (!id) { throw new Error(); } return id; }",
		"/** Open the dialog.\n *\n * @returns {object}\n */\nconst openDialog = () => ({ isOpen: true });",
		"/** Close the dialog. */\nconst closeDialog = () => { return; };",
		"const callbacks = [function namedCallback() {}, () => {}];",
		{
			name: "allows inline object arrows when enabled",
			code: "const callbacks = { onOpen: () => {} };",
			options: [{ ignoreInlineArrows: true }],
		},
		{
			name: "allows call-argument arrows without the option",
			code: "run(() => {});",
		},
		"const dialog = { nested: { close() {} }, value: 1 };",
		`defineModel({
	/** Read the model value.
	 *
	 * @param {string} value
	 * @returns {string}
	 * @throws {Error}
	 */
	get(value) {
		if (!value) {
			throw new Error();
		}

		return value;
	},
});`,
		"/** Open the dialog.\n *\n * @param {object} options\n * @param {object} options.trigger\n * @param {string} options.trigger.id\n * @param {number} [options.count=1]\n */\nfunction openDialog({ trigger: { id }, count = 1 }) {}",
		{
			name: "accepts plain property paths for defaults",
			code: "/** Check the result.\n *\n * @param {object} result\n * @param {string[]} result.errors\n * @param {boolean} result.validated\n */\nfunction checkResult({ errors = [], validated = true } = {}) {}",
		},
		{
			name: "accepts optional property paths for defaults",
			code: "/** Check the result.\n *\n * @param {object} [result]\n * @param {string[]} [result.errors]\n * @param {boolean} [result.validated]\n */\nfunction checkResult({ errors = [], validated = true } = {}) {}",
		},
		{
			name: "accepts array and mismatched defaults in bracketed paths",
			code: "/** Check the result.\n *\n * @param {object} [result={}]\n * @param {string[]} [result.errors=[]]\n * @param {boolean} [result.validated=other]\n */\nfunction checkResult({ errors = [], validated = true } = {}) {}",
		},
		{
			name: "accepts a bracketed default containing a space",
			code: '/** Set the label.\n *\n * @param {object} options\n * @param {string} [options.label="Hello world"]\n */\nfunction setLabel({ label = "Hello world" }) {}',
		},
		"/** Open the dialog.\n *\n * @param {object} options\n * @param {string} options.id\n */\nfunction openDialog({ id: dialogId }) {}",
		"/** Open the dialog.\n *\n * @param {object} [options]\n */\nfunction openDialog(options) {}",
		"/** Check the report.\n *\n * @param {object} result\n * @param {object} options\n * @param {object} resultLabels\n * @param {string} resultLabels.failed\n * @param {string} resultLabels.success\n * @param {string} [resultLabels.hintText]\n */\nfunction reportCheckResult(result, options, { failed, success, hintText }) {}",
		"/** Open the dialog.\n *\n * @param {object} options\n * @param {string} options.id\n */\nfunction openDialog({ id }) {}",
		"const dialog = {\n\t/** Open the dialog.\n\t *\n\t * @param {string} id\n\t */\n\topen(id) {},\n};",
		"const dialog = {\n\t/** Open the dialog.\n\t *\n\t * @param {string} id\n\t */\n\topen: (id) => {},\n};",
		"const dialog = {\n\t/** Open the dialog.\n\t *\n\t * @param {string} id\n\t */\n\topen(id) {},\n\t/** Close the dialog.\n\t *\n\t * @param {string} reason\n\t */\n\tclose: (reason) => {},\n};",
	],
	invalid: [
		{
			name: "requires a JSDoc block before named functions",
			code: "function openDialog() {}",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before exported declarations",
			code: "/** Open the dialog. */\n\nexport function openDialog() {}",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "rejects a blank line after an intervening directive",
			code: "/** Open the dialog. */\n// eslint-disable-next-line no-empty\n\nfunction openDialog() {}",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before function-valued constants",
			code: "const openDialog = () => {};",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before first-level object methods",
			code: "const dialog = { open() {} };",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before inline object arrows by default",
			code: "const callbacks = { onOpen: () => {} };",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before method shorthand when inline arrows are ignored",
			code: "const callbacks = { onOpen() {} };",
			options: [{ ignoreInlineArrows: true }],
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before function expression properties when inline arrows are ignored",
			code: "const callbacks = { onOpen: function () {} };",
			options: [{ ignoreInlineArrows: true }],
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires JSDoc before const arrows when inline arrows are ignored",
			code: "const onOpen = () => {};",
			options: [{ ignoreInlineArrows: true }],
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires documentation for function-valued defineModel options",
			code: `defineModel({
	get(value) {
		return value;
	},
});`,
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires a tag for every parameter",
			code: "/** Open the dialog. */\nfunction openDialog(id) {}",
			errors: [{ message: "Functions require an @param for id." }],
		},
		{
			name: "requires every destructured parameter path",
			code: "/** Open the dialog.\n *\n * @param {object} options\n */\nfunction openDialog({ trigger: { id }, count = 1 }) {}",
			errors: [
				{ message: "Functions require an @param for options.trigger." },
				{ message: "Functions require an @param for options.trigger.id." },
				{ message: "Functions require an @param for [options.count=1]." },
			],
		},
		{
			name: "reports an undocumented defaulted property",
			code: "/** Check the result.\n *\n * @param {object} [result={}]\n * @param {string[]} [result.errors=[]]\n */\nfunction checkResult({ errors = [], validated = true } = {}) {}",
			errors: [{ message: "Functions require an @param for [result.validated=true]." }],
		},
		{
			name: "matches a destructured parameter to its documented root",
			code: "/** Check the report.\n *\n * @param {object} result\n * @param {object} options\n * @param {object} resultLabels\n * @param {string} resultLabels.failed\n * @param {string} resultLabels.success\n */\nfunction reportCheckResult(result, options, { failed, success, hintText }) {}",
			errors: [{ message: "Functions require an @param for resultLabels.hintText." }],
		},
		{
			name: "falls back to options when a destructured parameter has no documented root",
			code: "/** Check the report.\n *\n * @param {object} result\n * @param {object} options\n */\nfunction reportCheckResult(result, options, { failed, success, hintText }) {}",
			errors: [
				{ message: "Functions require an @param for options.failed." },
				{ message: "Functions require an @param for options.success." },
				{ message: "Functions require an @param for options.hintText." },
			],
		},
		{
			name: "requires returns for explicit return values",
			code: "/** Open the dialog. */\nfunction openDialog() { return true; }",
			errors: [{ message: "Functions that return a value require an @returns tag." }],
		},
		{
			name: "requires returns for concise arrow functions",
			code: "/** Open the dialog. */\nconst openDialog = () => true;",
			errors: [{ message: "Functions that return a value require an @returns tag." }],
		},
		{
			name: "requires throws for explicit throws",
			code: "/** Open the dialog. */\nfunction openDialog() { throw new Error(); }",
			errors: [{ message: "Functions that throw require an @throws tag." }],
		},
		{
			name: "does not treat directives as documentation",
			code: "// oxlint-disable-next-line comments/function-documentation\nfunction openDialog() {}",
			errors: [{ message: "Functions require an immediately preceding JSDoc block." }],
		},
	],
});
