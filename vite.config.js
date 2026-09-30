import { defineConfig } from "vite-plus";

import oxfmtrc from "./.oxfmtrc.json" with { type: "json" };
import oxlintrc from "./.oxlintrc.json" with { type: "json" };
import lintConfigBase from "./base.json" with { type: "json" };
import lintConfigComments from "./comments.json" with { type: "json" };
import imports from "./imports.json" with { type: "json" };

// Combines the base and comments lint layers.
const lint = {
	...lintConfigBase,
	env: oxlintrc.env,
	ignorePatterns: oxlintrc.ignorePatterns,
	jsPlugins: [...lintConfigBase.jsPlugins, ...lintConfigComments.jsPlugins],
	overrides: [
		...(lintConfigBase.overrides ?? []),
		...(lintConfigComments.overrides ?? []),
		...(oxlintrc.overrides ?? []),
	],
	rules: { ...lintConfigBase.rules, ...lintConfigComments.rules },
};

export default defineConfig({
	fmt: {
		// Vite+ takes formatter settings from this block and may not apply
		// .oxfmtrc.json on its own, so those settings are copied in here
		// alongside the shared import sorting.
		...oxfmtrc,
		...imports,
	},
	staged: {
		"*": "vp check --fix",
	},
	lint,
});
