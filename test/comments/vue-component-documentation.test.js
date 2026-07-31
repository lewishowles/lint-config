import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RuleTester } from "oxlint/plugins-dev";
import rule from "../../comments/rules/vue-component-documentation.js";

/**
 * Create one temporary physical Vue fixture for a RuleTester case.
 *
 * @param  {string}  filename
 *     The fixture filename.
 * @param  {string}  source
 *     The complete Vue single-file component source.
 *
 * @returns  {object}
 *     The filename and setup hooks for the RuleTester case.
 */
function createVueFixture(filename, source) {
	// The temporary directory used by one isolated RuleTester case.
	const fixtureDirectory = mkdtempSync(join(tmpdir(), "lint-config-vue-component-documentation-"));
	// The full path used by RuleTester and the raw-file rule lookup.
	const fixturePath = join(fixtureDirectory, filename);

	return {
		/**
		 * Remove the temporary fixture after the test case.
		 */
		after() {
			rmSync(fixtureDirectory, { force: true, recursive: true });
		},
		/**
		 * Write the temporary fixture before the test case.
		 */
		before() {
			writeFileSync(fixturePath, source);
		},
		filename: fixturePath,
	};
}

// Runs the rule's valid and invalid examples.
const ruleTester = new RuleTester();

ruleTester.run("comments/vue-component-documentation", rule, {
	valid: [
		{
			...createVueFixture(
				"documented-script-setup.vue",
				[
					"<template><div /></template>",
					"",
					'<script lang="ts" setup>',
					"/** Describe the dialog component. */",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "accepts a documented script setup block",
			code: '/** Describe the dialog component. */\nconst componentName = "Dialog";',
		},
		{
			...createVueFixture(
				"documented-ordinary-script.vue",
				[
					"<template><div /></template>",
					"",
					'<script lang="ts">',
					"/** Describe the dialog component. */",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "ignores documented ordinary script blocks",
			code: '/** Describe the dialog component. */\nconst componentName = "Dialog";',
		},
		{
			...createVueFixture(
				"undocumented-ordinary-script.vue",
				[
					"<template><div /></template>",
					"",
					"<script>",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "ignores undocumented ordinary script blocks",
			code: 'const componentName = "Dialog";',
		},
		{
			...createVueFixture(
				"mixed-script-blocks.vue",
				[
					"<template><div /></template>",
					"",
					"<script>",
					'const componentOptions = { name: "Dialog" };',
					"</script>",
					"",
					"<script setup>",
					"/** Describe the dialog component. */",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "ignores an ordinary script when script setup is also documented",
			code: 'const componentOptions = { name: "Dialog" };',
		},
		{
			...createVueFixture("template-only.vue", "<template><div /></template>\n"),
			name: "ignores files without script blocks",
			code: "",
		},
		{
			name: "ignores virtual filenames",
			code: 'const componentName = "Dialog";',
			filename: "<stdin>.vue",
		},
	],
	invalid: [
		{
			...createVueFixture(
				"undocumented-script-setup.vue",
				[
					"<template><div /></template>",
					"",
					"<script setup>",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "requires documentation after the script setup opening tag",
			code: 'const componentName = "Dialog";',
			errors: [
				{
					message:
						"Vue script setup components require a documentation block after the opening tag.",
				},
			],
		},
		{
			...createVueFixture(
				"separated-component-documentation.vue",
				[
					"<template><div /></template>",
					"",
					"<script setup>",
					"",
					"/** Describe the dialog component. */",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "requires documentation without a blank line after the script setup tag",
			code: '\n\n/** Describe the dialog component. */\nconst componentName = "Dialog";',
			errors: [
				{
					message:
						"Vue script setup components require a documentation block after the opening tag.",
				},
			],
		},
		{
			...createVueFixture(
				"directive-script-setup.vue",
				[
					"<template><div /></template>",
					"",
					"<script setup>",
					"/* oxlint-disable comments/vue-component-documentation */",
					'const componentName = "Dialog";',
					"</script>",
					"",
				].join("\n"),
			),
			name: "does not treat directives as component documentation",
			code: '/* oxlint-disable comments/vue-component-documentation */\nconst componentName = "Dialog";',
			errors: [
				{
					message:
						"Vue script setup components require a documentation block after the opening tag.",
				},
			],
		},
		{
			...createVueFixture(
				"mixed-undocumented-script-setup.vue",
				[
					"<template><div /></template>",
					"",
					"<script setup>",
					'const componentName = "Dialog";',
					"</script>",
					"",
					"<script>",
					'const componentOptions = { name: "Dialog" };',
					"</script>",
					"",
				].join("\n"),
			),
			name: "requires documentation in the first block of a multi-script component",
			code: 'const componentName = "Dialog";',
			errors: [
				{
					message:
						"Vue script setup components require a documentation block after the opening tag.",
				},
			],
		},
	],
});
