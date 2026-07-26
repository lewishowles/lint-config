import {
	getCommentNeighbours,
	getCommentText,
	getLineCommentGroups,
	getLineIndent,
	getLineStart,
	getNewline,
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
 * Return continuation comments indexed by their group leader.
 *
 * @param  {object[][]}  lineCommentGroups
 *     The adjacent line-comment groups.
 * @returns  {object}
 *     The continuation comments and their leaders.
 */
function getLineCommentContinuations(lineCommentGroups) {
	const continuationComments = new Set();
	const continuationsByLeader = new Map();

	for (const group of lineCommentGroups) {
		if (group.length < 2) {
			continue;
		}

		const [leader, ...continuations] = group;

		continuationsByLeader.set(leader, continuations);

		for (const continuation of continuations) {
			continuationComments.add(continuation);
		}
	}

	return { continuationComments, continuationsByLeader };
}

/**
 * Return indentation relative to a comment's current indentation.
 *
 * @param  {string}  indentation
 *     The line indentation.
 * @param  {string}  commentIndent
 *     The leading comment's current indentation.
 * @returns  {string}
 *     The indentation to preserve after reindenting.
 */
function getRelativeIndent(indentation, commentIndent) {
	return indentation.startsWith(commentIndent)
		? indentation.slice(commentIndent.length)
		: indentation;
}

/**
 * Reindent every line of a leading comment.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The leading comment token.
 * @param  {string}  commentIndent
 *     The comment's current indentation.
 * @param  {string}  expectedIndent
 *     The documented code's indentation.
 * @returns  {string}
 *     The reindented comment text.
 */
function getReindentedCommentText(sourceCode, comment, commentIndent, expectedIndent) {
	return getCommentText(sourceCode, comment)
		.split(/\r\n|\n|\r/)
		.map((line, lineIndex) => {
			if (lineIndex === 0) {
				return `${expectedIndent}${line}`;
			}

			const lineIndent = line.match(/^[ \t]*/)[0];
			const relativeIndent = getRelativeIndent(lineIndent, commentIndent);

			return `${expectedIndent}${relativeIndent}${line.slice(lineIndent.length)}`;
		})
		.join(getNewline(sourceCode.text));
}

/**
 * Return replacements that align a leading comment group with its code.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The leading comment token.
 * @param  {object[]}  continuations
 *     The comment group's continuation tokens.
 * @param  {string}  actualIndent
 *     The comment's current indentation.
 * @param  {string}  expectedIndent
 *     The documented code's indentation.
 * @returns  {object[]}
 *     The indentation replacements.
 */
function getCommentIndentationFixes(
	sourceCode,
	comment,
	continuations,
	actualIndent,
	expectedIndent,
) {
	if (actualIndent === expectedIndent) {
		return [];
	}

	const fixes = [
		{
			range: [getLineStart(sourceCode, comment.range[0]), comment.range[1]],
			text: getReindentedCommentText(sourceCode, comment, actualIndent, expectedIndent),
		},
	];

	for (const continuation of continuations) {
		const continuationIndent = getLineIndent(sourceCode, continuation.range[0]) ?? "";
		const relativeIndent = getRelativeIndent(continuationIndent, actualIndent);

		fixes.push({
			range: [getLineStart(sourceCode, continuation.range[0]), continuation.range[1]],
			text: `${expectedIndent}${relativeIndent}${getCommentText(sourceCode, continuation)}`,
		});
	}

	return fixes;
}

/**
 * Return the replacement that places a final leading comment against its code.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The leading comment token.
 * @param  {object}  next
 *     The documented source token.
 * @param  {object|undefined}  followingComment
 *     The next comment token.
 * @param  {string}  expectedIndent
 *     The documented code's indentation.
 * @returns  {object|null}
 *     The gap replacement, or null when none is needed.
 */
function getCommentGapFix(sourceCode, comment, next, followingComment, expectedIndent) {
	if (followingComment !== undefined && followingComment.range[0] <= next.range[0]) {
		return null;
	}

	const gap = getCommentToTokenGap(sourceCode, comment, next);
	const desiredGap = `${getNewline(sourceCode.text)}${expectedIndent}`;

	return gap === desiredGap ? null : { range: [comment.range[1], next.range[0]], text: desiredGap };
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
				const { continuationComments, continuationsByLeader } = getLineCommentContinuations(
					getLineCommentGroups(context.sourceCode),
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

					const fixes = getCommentIndentationFixes(
						context.sourceCode,
						comment,
						continuationsByLeader.get(comment) ?? [],
						actualIndent,
						expectedIndent,
					);

					const followingComment = comments[index + 1];
					const gapFix = getCommentGapFix(
						context.sourceCode,
						comment,
						next,
						followingComment,
						expectedIndent,
					);

					if (gapFix !== null) {
						fixes.push(gapFix);
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
