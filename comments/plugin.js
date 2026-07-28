import blockComments from "./rules/block-comments.js";
import jsdocTagFormatting from "./rules/jsdoc-tag-formatting.js";
import lineComments from "./rules/line-comments.js";
import maxLineLength from "./rules/max-line-length.js";
import placement from "./rules/placement.js";
import sentencePunctuation from "./rules/sentence-punctuation.js";
import variableDeclarations from "./rules/variable-declarations.js";

export default {
	meta: { name: "comments" },
	rules: {
		"block-comments": blockComments,
		"jsdoc-tag-formatting": jsdocTagFormatting,
		"line-comments": lineComments,
		"max-line-length": maxLineLength,
		placement,
		"sentence-punctuation": sentencePunctuation,
		"variable-declarations": variableDeclarations,
	},
};
