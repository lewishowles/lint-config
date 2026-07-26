import { defineConfig } from "vite-plus";
import lintConfigBase from "./base.json" with { type: "json" };
import oxlintrc from "./.oxlintrc.json" with { type: "json" };

const lint = {
	...lintConfigBase,
	env: oxlintrc.env,
	overrides: oxlintrc.overrides,
};

export default defineConfig({ lint });
