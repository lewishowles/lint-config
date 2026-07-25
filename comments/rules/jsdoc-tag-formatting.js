import { formatJSDocComment, hasTargetJSDocTag, isJSDoc } from "../utils/jsdoc.js";
import { getCommentText } from "../utils/source.js";

/**
 * Create the JSDoc tag-formatting rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Format Phase 1 JSDoc tag spacing and grouping." },
		fixable: "code",
		type: "layout",
	},
	createOnce(context) {
		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (comment.type !== "Block") {
						continue;
					}

					const commentText = getCommentText(context.sourceCode, comment);

					if (!isJSDoc(commentText) || !hasTargetJSDocTag(context.sourceCode, comment)) {
						continue;
					}

					const formattedComment = formatJSDocComment(context.sourceCode, comment, {
						normaliseTags: true,
					});

					if (formattedComment === commentText) {
						continue;
					}

					context.report({
						fix: (fixer) => fixer.replaceText(comment, formattedComment),
						message: "JSDoc tags must use the configured spacing, order, and grouping.",
						node: comment,
					});
				}
			},
		};
	},
};
