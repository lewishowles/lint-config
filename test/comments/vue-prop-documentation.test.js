import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/vue-prop-documentation.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/vue-prop-documentation", rule, {
	valid: [
		{
			name: "accepts a documented runtime prop",
			code: `defineProps({
	/* The dialog title. */
	title: String,
});`,
		},
		{
			name: "accepts documented props in withDefaults regardless of default order",
			code: `withDefaults(
	defineProps({
		/* The dialog title. */
		title: String,
		/* The number of actions. */
		actionCount: Number,
	}),
	{
		actionCount: 0,
		title: "Dialog",
	},
);`,
		},
		{
			name: "accepts type-only props",
			filename: "component.ts",
			code: "defineProps<Props>();",
		},
		{
			name: "ignores unrelated compiler macros",
			code: `defineEmits({ submit: null });
defineModel({ default: null });
defineSlots({ default: () => null });
defineExpose({ openDialog() {} });
defineOptions({ inheritAttrs: false });`,
		},
	],
	invalid: [
		{
			name: "requires a block comment before an undocumented prop",
			code: "defineProps({ title: String });",
			errors: [
				{
					message: "Vue prop declarations require an immediately preceding block comment.",
				},
			],
		},
		{
			name: "reports every undocumented prop in a mixed declaration",
			code: `defineProps({
	/* The dialog title. */
	title: String,
	actionCount: Number,
});`,
			errors: [
				{
					message: "Vue prop declarations require an immediately preceding block comment.",
				},
			],
		},
	],
});
