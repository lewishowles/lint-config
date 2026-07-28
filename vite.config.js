import { defineConfig } from "vite-plus";
import lintConfigBase from "./base.json" with { type: "json" };
import lintConfigComments from "./comments.json" with { type: "json" };
import oxlintrc from "./.oxlintrc.json" with { type: "json" };

// Combines the base and comments lint layers.
const lint = {
	...lintConfigBase,
	env: oxlintrc.env,
	jsPlugins: [...lintConfigBase.jsPlugins, ...lintConfigComments.jsPlugins],
	overrides: oxlintrc.overrides,
	rules: { ...lintConfigBase.rules, ...lintConfigComments.rules },
};

export default defineConfig({
	staged: {
		"*": "vp check --fix",
	},
	lint,
});
