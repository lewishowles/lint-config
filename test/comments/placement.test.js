import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/placement.js";

const ruleTester = new RuleTester();

ruleTester.run("comments/placement", rule, {
	valid: [
		"const value = 1;",
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
	],
	invalid: [
		{
			name: "removes a blank line before a declaration comment",
			code: "  // Explain the value.\n\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 2 },
			],
			output: "// Explain the value.\nconst value = 1;",
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
			code: "// oxlint-disable-next-line comments/sentence-punctuation\n\t// Explain the value across two lines and\n\t// continue on the second line.\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 2, column: 1 },
			],
			output:
				"// oxlint-disable-next-line comments/sentence-punctuation\n// Explain the value across two lines and\n// continue on the second line.\nconst value = 1;",
		},
		{
			name: "does not treat comments separated by a directive as continuations",
			code: "if (isReady) {\n\t// First comment.\n\t// oxlint-disable-next-line comments/line-comments\n  // Second comment.\n\trunTask();\n}",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 4, column: 2 },
			],
			output:
				"if (isReady) {\n\t// First comment.\n\t// oxlint-disable-next-line comments/line-comments\n\t// Second comment.\n\trunTask();\n}",
		},
		{
			name: "reindents every line of a wrapped continuation comment to match its declaration",
			code: "\t// Explain the value across two lines and\n\t// continue on the second line.\nconst value = 1;",
			errors: [
				{ message: "Comment must be immediately before the documented code.", line: 1, column: 1 },
			],
			output:
				"// Explain the value across two lines and\n// continue on the second line.\nconst value = 1;",
		},
	],
});
