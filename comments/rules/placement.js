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
 * Return continuation comments indexed by their group leader.
 *
 * @param  {object[][]}  lineCommentGroups
 *     The adjacent line-comment groups.
 *
 * @returns  {object}
 *     The continuation comments and their leaders.
 */
function getLineCommentContinuations(lineCommentGroups) {
	// The comments that follow a group's leader, across every group.
	const continuationComments = new Set();
	// Each group's continuation comments, indexed by their leader.
	const continuationsByLeader = new Map();

	for (const group of lineCommentGroups) {
		if (group.length < 2) {
			continue;
		}

		// The group's leading comment and its continuations.
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
 *
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
 *
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

			// The line's current indentation.
			const lineIndent = line.match(/^[ \t]*/)[0];
			// The indentation to preserve relative to the comment's own indent.
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
 *
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

	// The replacements, starting with the leading comment's reindent.
	const fixes = [
		{
			range: [getLineStart(sourceCode, comment.range[0]), comment.range[1]],
			text: getReindentedCommentText(sourceCode, comment, actualIndent, expectedIndent),
		},
	];

	for (const continuation of continuations) {
		// The continuation's current indentation.
		const continuationIndent = getLineIndent(sourceCode, continuation.range[0]) ?? "";
		// The indentation to preserve relative to the leading comment's indent.
		const relativeIndent = getRelativeIndent(continuationIndent, actualIndent);

		fixes.push({
			range: [getLineStart(sourceCode, continuation.range[0]), continuation.range[1]],
			text: `${expectedIndent}${relativeIndent}${getCommentText(sourceCode, continuation)}`,
		});
	}

	return fixes;
}

/**
 * Return the replacement that closes the gap after a final leading comment.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The leading comment token.
 * @param  {object}  next
 *     The documented source token.
 * @param  {object|undefined}  followingComment
 *     The comment after this one in source order, when there is one.
 * @param  {string}  expectedIndent
 *     The documented code's indentation.
 *
 * @returns  {object|null}
 *     The gap replacement, or null when none is needed.
 */
function getCommentGapFix(sourceCode, comment, next, followingComment, expectedIndent) {
	// Whether another comment sits between this one and its documented code.
	const followingCommentIntervenes =
		followingComment !== undefined && followingComment.range[0] <= next.range[0];

	if (followingCommentIntervenes && !isDirectiveComment(followingComment)) {
		return null;
	}

	// Stop at an intervening directive so the fix range never overlaps it.
	const gapEnd = followingCommentIntervenes ? followingComment.range[0] : next.range[0];

	// What currently follows the comment, up to the code or directive.
	const gap = sourceCode.text.slice(comment.range[1], gapEnd);
	// The gap the documented code's indentation requires.
	const desiredGap = `${getNewline(sourceCode.text)}${expectedIndent}`;

	return gap === desiredGap ? null : { range: [comment.range[1], gapEnd], text: desiredGap };
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
			 * Align every leading comment in the file with its documented code.
			 */
			Program() {
				// Every comment token in the file, in source order.
				const comments = context.sourceCode.getAllComments();

				// The continuation comments and their group leaders.
				const { continuationComments, continuationsByLeader } = getLineCommentContinuations(
					getLineCommentGroups(context.sourceCode),
				);

				for (const [index, comment] of comments.entries()) {
					if (
						comment.type === "Shebang" ||
						isDirectiveComment(comment) ||
						continuationComments.has(comment)
					) {
						continue;
					}

					// The comment's neighbouring token and comment.
					const { next, previous } = getCommentNeighbours(context.sourceCode, comment);

					if (next === null || !isLeadingComment(context.sourceCode, comment, previous)) {
						continue;
					}

					// The documented code's indentation.
					const expectedIndent = getLineIndent(context.sourceCode, next.range[0]);
					// The comment's current indentation.
					const actualIndent = getLineIndent(context.sourceCode, comment.range[0]);

					if (expectedIndent === null || actualIndent === null) {
						continue;
					}

					// The reindentation fixes for the comment and its continuations.
					const fixes = getCommentIndentationFixes(
						context.sourceCode,
						comment,
						continuationsByLeader.get(comment) ?? [],
						actualIndent,
						expectedIndent,
					);

					// The next comment token, used to avoid overlapping gap fixes.
					const followingComment = comments[index + 1];

					// The fix that closes the gap between the comment and its code, when needed.
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
						/**
						 * Apply the comment's alignment fixes.
						 *
						 * @param  {object}  fixer
						 *     The Oxlint fixer.
						 *
						 * @returns  {object[]}
						 *     The fixes to apply.
						 */
						fix: (fixer) => fixes.map((fix) => fixer.replaceTextRange(fix.range, fix.text)),
						message: "Comment must be immediately before the documented code.",
						node: comment,
					});
				}
			},
		};
	},
};
