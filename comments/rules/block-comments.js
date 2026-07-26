import { formatJSDocComment, isJSDoc } from "../utils/jsdoc.js";
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
	createOnce(context) {
		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (comment.type !== "Block") {
						continue;
					}

					const commentText = getCommentText(context.sourceCode, comment);

					if (!isJSDoc(commentText)) {
						continue;
					}

					const formattedComment = formatJSDocComment(context.sourceCode, comment, {
						normaliseTags: false,
						wrap: false,
					});

					if (formattedComment === commentText) {
						continue;
					}

					context.report({
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
