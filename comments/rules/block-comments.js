import { formatJSDocBlockStructure, isJSDoc } from "../utils/jsdoc.js";
import { getCommentText, replaceMinimalComment } from "../utils/source.js";

/**
 * Create the JSDoc block-comment formatting rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Format JSDoc block comments." },
		fixable: "code",
		type: "layout",
	},
	/**
	 * Create the rule's node visitors.
	 *
	 * @param  {object}  context
	 *     The Oxlint rule context.
	 *
	 * @returns  {object}
	 *     The visitor functions for this rule.
	 */
	createOnce(context) {
		return {
			/**
			 * Format every JSDoc comment's block structure in the file.
			 */
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (comment.type !== "Block") {
						continue;
					}

					// The comment's raw source text.
					const commentText = getCommentText(context.sourceCode, comment);

					if (!isJSDoc(commentText)) {
						continue;
					}

					// The comment, with its block structure and delimiters normalised.
					const formattedComment = formatJSDocBlockStructure(context.sourceCode, comment);

					if (formattedComment === commentText) {
						continue;
					}

					context.report({
						/**
						 * Apply the formatted replacement to the comment.
						 *
						 * @param  {object}  fixer
						 *     The Oxlint fixer.
						 *
						 * @returns  {object}
						 *     The fix to apply.
						 */
						fix: (fixer) => {
							return replaceMinimalComment(fixer, comment, commentText, formattedComment);
						},
						message: "JSDoc comments must use the configured block format.",
						node: comment,
					});
				}
			},
		};
	},
};
