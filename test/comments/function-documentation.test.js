import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/function-documentation.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/function-documentation", rule, {
	valid: [
		"/** Open the dialog. */\nfunction openDialog() {}",
		"/** Open the dialog.\n *\n * @param {string} id\n * @returns {string}\n * @throws {Error}\n */\nexport function openDialog(id) { if (!id) { throw new Error(); } return id; }",
		"/** Open the dialog.\n *\n * @returns {object}\n */\nconst openDialog = () => ({ isOpen: true });",
		"/** Close the dialog. */\nconst closeDialog = () => { return; };",
		"const callbacks = [function namedCallback() {}, () => {}];",
		"const dialog = { nested: { close() {} }, value: 1 };",
		"/** Open the dialog.\n *\n * @param {object} options\n * @param {object} options.trigger\n * @param {string} options.trigger.id\n * @param {number} [options.count=1]\n */\nfunction openDialog({ trigger: { id }, count = 1 }) {}",
		"/** Open the dialog.\n *\n * @param {object} options\n * @param {string} options.id\n */\nfunction openDialog({ id: dialogId }) {}",
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
