import { base, comments, lintConfig, vue } from "@lewishowles/lint-config/layers";

import assert from "node:assert/strict";
import test from "node:test";

test("Exports the base and comments layers as config objects", () => {
	assert.ok(base.rules["@stylistic/no-confusing-arrow"]);
	assert.ok(comments.rules["comments/formatting"]);
	assert.ok(base.jsPlugins.length > 0);
	assert.ok(comments.jsPlugins.length > 0);
	assert.equal(base.extends, undefined);
	assert.equal(comments.extends, undefined);
});

test("Includes the base config as an object in the Vue layer", () => {
	assert.deepEqual(vue.extends, [base]);
	assert.ok(vue.rules["vue/valid-define-props"]);
	assert.ok(vue.plugins.includes("vue"));
});

test("Lifts Vue globals and inherited base environments", () => {
	const lint = lintConfig([vue, comments]);

	assert.equal(lint.globals.defineProps, "readonly");
	assert.equal(lint.env.builtin, true);
	assert.equal(lint.env.browser, true);
	assert.deepEqual(lint.extends, [vue, comments]);
});

test("Lifts environments from a directly selected base layer", () => {
	const lint = lintConfig([base]);

	assert.deepEqual(lint.env, base.env);
	assert.deepEqual(lint.extends, [base]);
});

test("Local settings override layer values without losing other globals", () => {
	const local = {
		env: { browser: false, node: true },
		globals: { defineProps: "writable", customGlobal: "readonly" },
		rules: { "no-undef": "off" },
		extends: ["./vue.json"],
	};

	const lint = lintConfig([vue], local);

	assert.deepEqual(lint.env, { builtin: true, browser: false, node: true });
	assert.equal(lint.globals.defineProps, "writable");
	assert.equal(lint.globals.defineEmits, "readonly");
	assert.equal(lint.globals.customGlobal, "readonly");
	assert.deepEqual(lint.rules, local.rules);
	assert.deepEqual(lint.extends, [vue]);
});
