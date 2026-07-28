import {
	getCommentText,
	getLineCommentGroups,
	getLineIndent,
	getLineStart,
} from "../utils/source.js";

/**
 * Create the line-comment alignment rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Align wrapped line comments with their first marker." },
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
			 * Align every wrapped line-comment group in the file.
			 */
			Program() {
				for (const commentGroup of getLineCommentGroups(context.sourceCode)) {
					if (commentGroup.length < 2) {
						continue;
					}

					// The group's leading comment's indentation.
					const firstIndent = getLineIndent(context.sourceCode, commentGroup[0].range[0]);

					if (firstIndent === null) {
						continue;
					}

					// The reindentation fixes for the group's comments.
					const fixes = [];

					for (const comment of commentGroup) {
						// The comment's current indentation.
						const indentation = getLineIndent(context.sourceCode, comment.range[0]);

						if (indentation === null || indentation === firstIndent) {
							continue;
						}

						fixes.push({
							range: [getLineStart(context.sourceCode, comment.range[0]), comment.range[1]],
							text: `${firstIndent}${getCommentText(context.sourceCode, comment)}`,
						});
					}

					if (fixes.length === 0) {
						continue;
					}

					context.report({
						/**
						 * Apply the group's alignment fixes.
						 *
						 * @param  {object}  fixer
						 *     The Oxlint fixer.
						 *
						 * @returns  {object[]}
						 *     The fixes to apply.
						 */
						fix: (fixer) => fixes.map((fix) => fixer.replaceTextRange(fix.range, fix.text)),
						message: "Wrapped line comments must align with the first comment marker.",
						node: commentGroup[0],
					});
				}
			},
		};
	},
};
