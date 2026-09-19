import classDocumentation from "./rules/class-documentation.js";
import configuredApiCalls from "./rules/configured-api-calls.js";
import formatting from "./rules/formatting.js";
import functionDocumentation from "./rules/function-documentation.js";
import placement from "./rules/placement.js";
import variableDeclarations from "./rules/variable-declarations.js";
import vueComponentDocumentation from "./rules/vue-component-documentation.js";
import vueEmitDocumentation from "./rules/vue-emit-documentation.js";
import vuePropDocumentation from "./rules/vue-prop-documentation.js";

export default {
	meta: { name: "comments" },
	rules: {
		"class-documentation": classDocumentation,
		"configured-api-calls": configuredApiCalls,
		formatting,
		"function-documentation": functionDocumentation,
		placement,
		"variable-declarations": variableDeclarations,
		"vue-component-documentation": vueComponentDocumentation,
		"vue-emit-documentation": vueEmitDocumentation,
		"vue-prop-documentation": vuePropDocumentation,
	},
};
