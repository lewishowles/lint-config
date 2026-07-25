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
	createOnce(context) {
		return {
			Program() {
				for (const comments of getLineCommentGroups(context.sourceCode)) {
					const firstIndent = getLineIndent(context.sourceCode, comments[0].range[0]);

					if (firstIndent === null) {
						continue;
					}

					const fixes = [];

					for (const comment of comments) {
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
						fix: (fixer) => fixes.map((fix) => fixer.replaceTextRange(fix.range, fix.text)),
						message: "Wrapped line comments must align with the first comment marker.",
						node: comments[0],
					});
				}
			},
		};
	},
};
