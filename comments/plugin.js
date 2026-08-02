import blockComments from "./rules/block-comments.js";
import configuredApiCalls from "./rules/configured-api-calls.js";
import functionDocumentation from "./rules/function-documentation.js";
import jsdocTagFormatting from "./rules/jsdoc-tag-formatting.js";
import lineComments from "./rules/line-comments.js";
import maxLineLength from "./rules/max-line-length.js";
import placement from "./rules/placement.js";
import sentencePunctuation from "./rules/sentence-punctuation.js";
import variableDeclarations from "./rules/variable-declarations.js";
import vueComponentDocumentation from "./rules/vue-component-documentation.js";
import vuePropDocumentation from "./rules/vue-prop-documentation.js";

export default {
	meta: { name: "comments" },
	rules: {
		"block-comments": blockComments,
		"configured-api-calls": configuredApiCalls,
		"function-documentation": functionDocumentation,
		"jsdoc-tag-formatting": jsdocTagFormatting,
		"line-comments": lineComments,
		"max-line-length": maxLineLength,
		placement,
		"sentence-punctuation": sentencePunctuation,
		"variable-declarations": variableDeclarations,
		"vue-component-documentation": vueComponentDocumentation,
		"vue-prop-documentation": vuePropDocumentation,
	},
};
