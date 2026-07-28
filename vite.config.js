import { defineConfig } from "vite-plus";
import lintConfigBase from "./base.json" with { type: "json" };
import lintConfigComments from "./comments.json" with { type: "json" };
import oxfmtrc from "./.oxfmtrc.json" with { type: "json" };
import oxlintrc from "./.oxlintrc.json" with { type: "json" };

// Combines the base and comments lint layers.
const lint = {
	...lintConfigBase,
	env: oxlintrc.env,
	ignorePatterns: oxlintrc.ignorePatterns,
	jsPlugins: [...lintConfigBase.jsPlugins, ...lintConfigComments.jsPlugins],
	overrides: oxlintrc.overrides,
	rules: { ...lintConfigBase.rules, ...lintConfigComments.rules },
};

export default defineConfig({
	fmt: {
		// For whatever reason, ignorePatterns is, well, ignored from the
		// oxfmtrc file; adding it explicitly seems to fix.
		ignorePatterns: oxfmtrc.ignorePatterns,
	},
	staged: {
		"*": "vp check --fix",
	},
	lint,
});
