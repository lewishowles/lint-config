import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/class-documentation.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/class-documentation", rule, {
	valid: [
		"/* The dialog component. */\nclass Dialog {}",
		"/** The dialog component. */\nclass Dialog {}",
		"/* The dialog component. */\nexport class Dialog {}",
		"/* The dialog component. */\nexport default class Dialog {}",
		"/* The dialog component. */\nconst Dialog = class {}",
		"/* The exported dialog component. */\nexport const Dialog = class {}",
		"const Dialog = class {}, isOpen = false",
		"if (isReady) {\n\t/* The dialog component. */\n\tclass Dialog {}\n}",
		"/** The dialog component. */\nclass Dialog {\n\t/** Create the dialog.\n\t *\n\t * @param {string} label\n\t */\n\tconstructor(label) {}\n}",
		"/** The dialog component. */\nclass Dialog {\n\t/** Create the dialog. */\n\tconstructor() {}\n}",
		"/** The dialog component. */\nclass Dialog {\n\t/** Create the dialog. */\n\tconstructor() { return {}; }\n}",
	],
	invalid: [
		{
			name: "requires a block comment before class declarations",
			code: "class Dialog {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "rejects a line comment before class declarations",
			code: "// The dialog component.\nclass Dialog {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "rejects a block comment separated by a blank line",
			code: "/* The dialog component. */\n\nclass Dialog {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "does not treat an Oxlint directive as documentation",
			code: "/* oxlint-disable-next-line comments/class-documentation */\nclass Dialog {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "requires a block comment before a const class expression",
			code: "const Dialog = class {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "requires a block comment before an exported const class expression",
			code: "export const Dialog = class {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "rejects a line comment before a const class expression",
			code: "// The dialog component.\nconst Dialog = class {}",
			errors: [{ message: "Classes require an immediately preceding block comment." }],
		},
		{
			name: "requires a JSDoc block before constructors",
			code: "/** The dialog component. */\nclass Dialog {\n\tconstructor(label) {}\n}",
			errors: [{ message: "Constructors require an immediately preceding JSDoc block." }],
		},
		{
			name: "requires a tag for every constructor parameter",
			code: "/** The dialog component. */\nclass Dialog {\n\t/** Create the dialog. */\n\tconstructor(label) {}\n}",
			errors: [{ message: "Constructors require an @param for label." }],
		},
		{
			name: "rejects a plain block comment before constructors",
			code: "/** The dialog component. */\nclass Dialog {\n\t/* Create the dialog. */\n\tconstructor() {}\n}",
			errors: [{ message: "Constructors require an immediately preceding JSDoc block." }],
		},
	],
});
