import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/configured-api-calls.js";

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/configured-api-calls", rule, {
	valid: [
		[
			"// Register the before-mount hook.",
			"onBeforeMount();",
			"// Register the mounted hook.",
			"onMounted();",
			"// Register the before-update hook.",
			"onBeforeUpdate();",
			"// Register the updated hook.",
			"onUpdated();",
			"// Register the before-unmount hook.",
			"onBeforeUnmount();",
			"// Register the unmounted hook.",
			"onUnmounted();",
			"// Register the activated hook.",
			"onActivated();",
			"// Register the deactivated hook.",
			"onDeactivated();",
			"// Handle captured errors.",
			"onErrorCaptured();",
			"// Track render dependencies.",
			"onRenderTracked();",
			"// Track render triggers.",
			"onRenderTriggered();",
			"// Register server-side data loading.",
			"onServerPrefetch();",
			"// Watch the source.",
			"watch();",
			"// Watch the source reactively.",
			"watchEffect();",
			"// Watch after the DOM updates.",
			"watchPostEffect();",
			"// Watch synchronously.",
			"watchSyncEffect();",
			"// Close when focus leaves the element.",
			"onClickOutside();",
		].join("\n"),
		"// Store the stop handle.\nconst stop = watch();",
		"// Store the stop handle.\nlet stop = watch();",
		"// Store the stop handle.\nvar stop = watch();",
		"const stop =\n// Register the watcher.\nwatch();",
		{
			code: "// Subscribe to updates.\nsubscribe();\n// Watch the source.\nwatch();",
			options: [{ additionalApis: ["subscribe"] }],
		},
		"trigger.focus();\ndialog.showModal();\nobj.watch();\nsubscribe();",
	],
	invalid: [
		{
			name: "requires a comment before a lifecycle hook",
			code: "onMounted();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "requires a comment before a reactive effect",
			code: "watchEffect();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "requires a comment before an outside-click hook",
			code: "onClickOutside();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "requires a comment before an undocumented const initializer",
			code: "const stop = watch();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "requires a comment before an undocumented var initializer",
			code: "var stop = watch();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "does not exempt a nested call from the declaration comment",
			code: "// Store the stop handle.\nconst stop = wrap(watch());",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "rejects a comment separated by a blank line",
			code: "// Watch the source.\n\nwatch();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "requires a line comment instead of a block comment",
			code: "/* Watch the source. */\nwatch();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "does not treat an Oxlint directive as documentation",
			code: "// oxlint-disable-next-line no-unused-vars\nwatch();",
			errors: [{ message: "Configured API calls require an immediately preceding line comment." }],
		},
		{
			name: "reports configured additional APIs while retaining built-ins",
			code: "subscribe();\nwatch();",
			options: [{ additionalApis: ["subscribe"] }],
			errors: [
				{ message: "Configured API calls require an immediately preceding line comment." },
				{ message: "Configured API calls require an immediately preceding line comment." },
			],
		},
	],
});
