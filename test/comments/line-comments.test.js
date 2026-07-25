import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/line-comments.js";

const ruleTester = new RuleTester();

ruleTester.run("comments/line-comments", rule, {
	valid: [
		"const value = 1;",
		"// Close the dialog when focus moves outside the component and restore focus\n// to the original trigger.\nonClickOutside(dialog, closeDialog);",
	],
	invalid: [
		{
			code: "\t// Close the dialog when focus moves outside the component and restore focus\n  // to the original trigger.\nonClickOutside(dialog, closeDialog);",
			errors: [
				{
					message: "Wrapped line comments must align with the first comment marker.",
					line: 1,
					column: 1,
				},
			],
			output:
				"\t// Close the dialog when focus moves outside the component and restore focus\n\t// to the original trigger.\nonClickOutside(dialog, closeDialog);",
		},
	],
});
