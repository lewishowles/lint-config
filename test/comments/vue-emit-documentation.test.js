import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/vue-emit-documentation.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/vue-emit-documentation", rule, {
	valid: [
		{
			name: "accepts a documented runtime event",
			filename: "component.vue",
			code: `defineEmits({
	/* The dialog submit event. */
	submit: null,
});`,
		},
		{
			name: "accepts a function-valued event with complete tags",
			filename: "component.vue",
			code: `defineEmits({
	/** Validate the dialog submit event.
	 *
	 * @param {string} value
	 * @returns {boolean}
	 * @throws {Error}
	 */
	submit(value) {
		if (!value) {
			throw new Error();
		}

		return true;
	},
});`,
		},
		{
			name: "accepts a documented function-valued event without checking function tags",
			filename: "component.vue",
			code: `defineEmits({
	/** Validate the dialog submit event. */
	submit(value) {
		if (!value) {
			throw new Error();
		}

		return true;
	},
});`,
		},
		{
			name: "ignores array-form events",
			filename: "component.vue",
			code: 'defineEmits(["close", "open"]);',
		},
		{
			name: "ignores type-only events",
			filename: "component.ts",
			code: "defineEmits<Events>();",
		},
		{
			name: "ignores non-Vue files",
			filename: "events.js",
			code: "defineEmits({ submit: null });",
		},
	],
	invalid: [
		{
			name: "requires a block comment before an undocumented event",
			filename: "component.vue",
			code: "defineEmits({ submit: null });",
			errors: [
				{
					message: "Vue emit declarations require an immediately preceding block comment.",
				},
			],
		},
		{
			name: "requires a block comment before an undocumented function-valued event",
			filename: "component.vue",
			code: `defineEmits({
	submit: () => null,
});`,
			errors: [
				{
					message: "Vue emit declarations require an immediately preceding block comment.",
				},
			],
		},
	],
});
