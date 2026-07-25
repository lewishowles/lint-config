import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/placement.js";

const ruleTester = new RuleTester();

ruleTester.run("comments/placement", rule, {
	valid: [
		"const value = 1;",
		"// Explain the value.\nconst value = 1;",
		`/**
 * Register a dialog.
 */
registerDialog();`,
	],
	invalid: [
		{
			code: "  // Explain the value.\n\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 2 },
			],
			output: "// Explain the value.\nconst value = 1;",
		},
		{
			code: "\t/**\n\t * Explain the value.\n\t */\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 1 },
			],
			output: "/**\n * Explain the value.\n */\nconst value = 1;",
		},
	],
});
