import {
	getCommentNeighbours,
	getCommentText,
	getLineCommentGroups,
	getLineIndent,
	getLineStart,
	getNewline,
	isDirectiveComment,
	isLeadingComment,
} from "../utils/source.js";

/**
 * Return the end-to-token gap for a leading comment.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The comment token.
 * @param  {object}  next
 *     The next source token.
 * @returns  {string}
 *     The source gap after the comment.
 */
function getCommentToTokenGap(sourceCode, comment, next) {
	return sourceCode.text.slice(comment.range[1], next.range[0]);
}

/**
 * Create the immediate-comment-placement rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Keep comments immediately before documented code." },
		fixable: "code",
		type: "layout",
	},
	createOnce(context) {
		return {
			Program() {
				const comments = context.sourceCode.getAllComments();

				const lineCommentGroups = getLineCommentGroups(context.sourceCode).map((group) =>
					group.filter((comment) => !isDirectiveComment(comment)),
				);

				const continuationComments = new Set(lineCommentGroups.flatMap((group) => group.slice(1)));
				const continuationsByLeader = new Map(
					lineCommentGroups
						.filter((group) => group.length > 1)
						.map((group) => [group[0], group.slice(1)]),
				);

				for (const [index, comment] of comments.entries()) {
					if (comment.type === "Shebang" || continuationComments.has(comment)) {
						continue;
					}

					const { next, previous } = getCommentNeighbours(context.sourceCode, comment);

					if (next === null || !isLeadingComment(context.sourceCode, comment, previous)) {
						continue;
					}

					const expectedIndent = getLineIndent(context.sourceCode, next.range[0]);
					const actualIndent = getLineIndent(context.sourceCode, comment.range[0]);

					if (expectedIndent === null || actualIndent === null) {
						continue;
					}

					const fixes = [];

					if (actualIndent !== expectedIndent) {
						const commentText = getCommentText(context.sourceCode, comment);
						const indentedComment = commentText
							.split(/\r\n|\n|\r/)
							.map((line, lineIndex) => {
								if (lineIndex === 0) {
									return `${expectedIndent}${line}`;
								}

								const lineIndent = line.match(/^[ \t]*/)[0];
								const relativeIndent = lineIndent.startsWith(actualIndent)
									? lineIndent.slice(actualIndent.length)
									: lineIndent;

								return `${expectedIndent}${relativeIndent}${line.slice(lineIndent.length)}`;
							})
							.join(getNewline(context.sourceCode.text));

						fixes.push({
							range: [getLineStart(context.sourceCode, comment.range[0]), comment.range[1]],
							text: indentedComment,
						});

						for (const continuation of continuationsByLeader.get(comment) ?? []) {
							const continuationIndent =
								getLineIndent(context.sourceCode, continuation.range[0]) ?? "";
							const relativeIndent = continuationIndent.startsWith(actualIndent)
								? continuationIndent.slice(actualIndent.length)
								: continuationIndent;

							fixes.push({
								range: [
									getLineStart(context.sourceCode, continuation.range[0]),
									continuation.range[1],
								],
								text: `${expectedIndent}${relativeIndent}${getCommentText(context.sourceCode, continuation)}`,
							});
						}
					}

					const followingComment = comments[index + 1];
					const isFinalComment =
						followingComment === undefined || followingComment.range[0] > next.range[0];
					const gap = getCommentToTokenGap(context.sourceCode, comment, next);
					const newline = getNewline(context.sourceCode.text);
					const desiredGap = `${newline}${expectedIndent}`;

					if (isFinalComment && gap !== desiredGap) {
						fixes.push({ range: [comment.range[1], next.range[0]], text: desiredGap });
					}

					if (fixes.length === 0) {
						continue;
					}

					context.report({
						fix: (fixer) => fixes.map((fix) => fixer.replaceTextRange(fix.range, fix.text)),
						message: "Comment must be immediately before the documented code.",
						node: comment,
					});
				}
			},
		};
	},
};
