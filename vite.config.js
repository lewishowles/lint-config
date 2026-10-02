import { base, comments, lintConfig } from "./layers.js";
import { defineConfig } from "vite-plus";

import oxfmtrc from "./.oxfmtrc.json" with { type: "json" };
import oxlintrc from "./.oxlintrc.json" with { type: "json" };
import imports from "./imports.json" with { type: "json" };

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
	lint: lintConfig([base, comments], oxlintrc),
});
