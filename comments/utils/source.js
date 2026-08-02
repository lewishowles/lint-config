// The token types treated as comments.
const commentTypes = new Set(["Block", "Line", "Shebang"]);

/**
 * Return whether a source item is a comment token.
 *
 * @param  {object}  item
 *     The source item to inspect.
 *
 * @returns  {boolean}
 *     Whether the item is a comment token.
 */
export function isComment(item) {
	return commentTypes.has(item.type);
}

/**
 * Return the source text for a comment token.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The comment token.
 *
 * @returns  {string}
 *     The comment's source text.
 */
export function getCommentText(sourceCode, comment) {
	return sourceCode.text.slice(comment.range[0], comment.range[1]);
}

/**
 * Return the smallest replacement that changes one comment to formatted text.
 *
 * @param  {object}  comment
 *     The comment token.
 * @param  {string}  commentText
 *     The comment's source text.
 * @param  {string}  formattedComment
 *     The formatted replacement text.
 *
 * @returns  {object}
 *     The source range and replacement text.
 */
export function getMinimalCommentReplacement(comment, commentText, formattedComment) {
	// The count of unchanged characters shared at the start of both texts.
	let start = 0;

	while (
		start < commentText.length &&
		start < formattedComment.length &&
		commentText[start] === formattedComment[start]
	) {
		start += 1;
	}

	// The count of unchanged characters shared at the end of both texts.
	let end = 0;

	while (
		end < commentText.length - start &&
		end < formattedComment.length - start &&
		commentText.at(-end - 1) === formattedComment.at(-end - 1)
	) {
		end += 1;
	}

	return {
		range: [comment.range[0] + start, comment.range[1] - end],
		text: formattedComment.slice(start, formattedComment.length - end),
	};
}

/**
 * Replace a comment using the smallest changed source range.
 *
 * @param  {object}  fixer
 *     The Oxlint fixer.
 * @param  {object}  comment
 *     The comment token.
 * @param  {string}  sourceText
 *     The comment's source text.
 * @param  {string}  formattedText
 *     The formatted replacement text.
 *
 * @returns  {object}
 *     The fixer replacement.
 */
export function replaceMinimalComment(fixer, comment, sourceText, formattedText) {
	// The smallest source range and text that changes the comment.
	const replacement = getMinimalCommentReplacement(comment, sourceText, formattedText);

	return fixer.replaceTextRange(replacement.range, replacement.text);
}

/**
 * Return whether a comment is an inline tool directive.
 *
 * @param  {object}  comment
 *     The comment token.
 *
 * @returns  {boolean}
 *     Whether the comment starts with a recognised directive prefix.
 */
export function isDirectiveComment(comment) {
	return /^(?:eslint|oxlint|istanbul|c8)-/.test(comment.value.trim());
}

/**
 * Return the source line containing an offset.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {number}  offset
 *     The source offset.
 *
 * @returns  {number}
 *     The one-based source line.
 */
export function getLineNumber(sourceCode, offset) {
	return sourceCode.getLocFromIndex(offset).line;
}

/**
 * Return the offset at which an offset's source line starts.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {number}  offset
 *     The source offset.
 *
 * @returns  {number}
 *     The line-start offset.
 */
export function getLineStart(sourceCode, offset) {
	return sourceCode.lineStartIndices[getLineNumber(sourceCode, offset) - 1];
}

/**
 * Return the whitespace before a source offset on its line.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {number}  offset
 *     The source offset.
 *
 * @returns  {string|null}
 *     The line indentation, or null when code precedes the offset.
 */
export function getLineIndent(sourceCode, offset) {
	// The offset at which the offset's line begins.
	const lineStart = getLineStart(sourceCode, offset);
	// The source text between the line start and the offset.
	const prefix = sourceCode.text.slice(lineStart, offset);

	return /^\s*$/.test(prefix) ? prefix : null;
}

/**
 * Return the source items immediately around a comment.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The comment token.
 *
 * @returns  {object}
 *     The previous and next non-comment source items.
 */
export function getCommentNeighbours(sourceCode, comment) {
	// Every token and comment in the file, in source order.
	const sourceItems = sourceCode.tokensAndComments;

	// The comment's position within sourceItems.
	const commentIndex = sourceItems.findIndex(
		(item) => item.range[0] === comment.range[0] && item.range[1] === comment.range[1],
	);

	// The preceding non-comment source item, once found.
	let previous = null;
	// The following non-comment source item, once found.
	let next = null;

	for (let index = commentIndex - 1; index >= 0; index -= 1) {
		if (!isComment(sourceItems[index])) {
			previous = sourceItems[index];

			break;
		}
	}

	for (let index = commentIndex + 1; index < sourceItems.length; index += 1) {
		if (!isComment(sourceItems[index])) {
			next = sourceItems[index];

			break;
		}
	}

	return { next, previous };
}

/**
 * Return the comments that form one adjacent line-comment group.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 *
 * @returns  {object[][]}
 *     Adjacent line-comment groups.
 */
export function getLineCommentGroups(sourceCode) {
	// Every line comment in the file, in source order.
	const comments = sourceCode.getAllComments().filter((comment) => comment.type === "Line");
	// The adjacent comment groups, built up in place.
	const groups = [];

	for (const comment of comments) {
		if (isDirectiveComment(comment)) {
			continue;
		}

		// The group currently being built, when there is one.
		const group = groups.at(-1);
		// The current group's last comment, when there is one.
		const previousComment = group?.at(-1);

		// The source text between the previous comment and this one.
		const gap = previousComment
			? sourceCode.text.slice(previousComment.range[1], comment.range[0])
			: "";

		// How many newlines separate this comment from the previous one.
		const newlineCount = gap.match(/\r\n|\n|\r/g)?.length ?? 0;

		if (group && newlineCount === 1 && /^[ \t]*\r?\n[ \t]*$/.test(gap)) {
			group.push(comment);
		} else {
			groups.push([comment]);
		}
	}

	return groups;
}

/**
 * Return the newline sequence used by a source file.
 *
 * @param  {string}  source
 *     The source text.
 *
 * @returns  {string}
 *     The source newline sequence.
 */
export function getNewline(source) {
	return source.includes("\r\n") ? "\r\n" : "\n";
}

/**
 * Return whether a comment is a leading comment for the next source token.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The comment token.
 * @param  {object|null}  previous
 *     The preceding non-comment source item.
 *
 * @returns  {boolean}
 *     Whether the comment is on a line of its own before code.
 */
export function isLeadingComment(sourceCode, comment, previous) {
	if (getLineIndent(sourceCode, comment.range[0]) === null) {
		return false;
	}

	return previous === null || comment.loc.start.line > previous.loc.end.line;
}

/**
 * Return whether a line comment immediately documents a source node.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The source node.
 *
 * @returns  {boolean}
 *     Whether an ordinary line comment immediately precedes the node.
 */
export function hasImmediateLineComment(sourceCode, node) {
	// Finds the closest preceding comment.
	const comment = sourceCode
		.getAllComments()
		.findLast((candidate) => candidate.range[1] <= node.range[0]);

	if (comment?.type !== "Line" || isDirectiveComment(comment)) {
		return false;
	}

	// Checks the comments immediately around the node.
	const { next, previous } = getCommentNeighbours(sourceCode, comment);

	// Confirms there is no blank line before the node.
	const gap = sourceCode.text.slice(comment.range[1], node.range[0]);

	return (
		next?.range[0] === node.range[0] &&
		isLeadingComment(sourceCode, comment, previous) &&
		/^\r?\n[ \t]*$/.test(gap)
	);
}
