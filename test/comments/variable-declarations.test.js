import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/variable-declarations.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/variable-declarations", rule, {
	valid: [
		"var legacyValue = getLegacyValue();",
		"// The dialog element.\nconst dialog = getDialog();",
		"// The observer used to track dialog size changes.\nlet resizeObserver;",
		"// The dialog state and actions.\nconst { close, isOpen, open } = useDialog();",
		"for (let index = 0; index < items.length; index += 1) {}",
		"for (const item of items) {}",
		"for (const key in item) {}",
		"for (let index = 0, length = items.length; index < length; index += 1) {}",
		"({ isOpen } = nextState);",
		"dialog.value = null;",
		"items.push(item);",
	],
	invalid: [
		{
			name: "requires a comment before a const declaration",
			code: "const dialog = getDialog();",
			errors: [{ message: "Variable declarations require an immediately preceding line comment." }],
		},
		{
			name: "requires a comment inside a nested block",
			code: "if (isReady) {\n\tlet resizeObserver;\n}",
			errors: [{ message: "Variable declarations require an immediately preceding line comment." }],
		},
		{
			name: "rejects a comment separated by a blank line",
			code: "// The dialog element.\n\nconst dialog = getDialog();",
			errors: [{ message: "Variable declarations require an immediately preceding line comment." }],
		},
		{
			name: "requires a line comment instead of a block comment",
			code: "/* The dialog element. */\nconst dialog = getDialog();",
			errors: [{ message: "Variable declarations require an immediately preceding line comment." }],
		},
		{
			name: "does not treat an Istanbul directive as documentation",
			code: "// istanbul-ignore-next\nconst dialog = getDialog();",
			errors: [{ message: "Variable declarations require an immediately preceding line comment." }],
		},
		{
			name: "rejects multiple declarators with a declaration comment",
			code: "// The dialog state.\nconst dialog = getDialog(), isOpen = false;",
			errors: [{ message: "Declare one variable per declaration statement." }],
		},
		{
			name: "reports missing documentation and multiple declarators independently",
			code: "const dialog = getDialog(), isOpen = false;",
			errors: [
				{ message: "Variable declarations require an immediately preceding line comment." },
				{ message: "Declare one variable per declaration statement." },
			],
		},
	],
});
