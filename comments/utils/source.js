const commentTypes = new Set(["Block", "Line", "Shebang"]);

/**
 * Return whether a source item is a comment token.
 *
 * @param  {object}  item
 *     The source item to inspect.
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
 * @returns  {object}
 *     The source range and replacement text.
 */
export function getMinimalCommentReplacement(comment, commentText, formattedComment) {
	let start = 0;

	while (
		start < commentText.length &&
		start < formattedComment.length &&
		commentText[start] === formattedComment[start]
	) {
		start += 1;
	}

	let end = 0;

	while (
		commentText.at(-end - 1) === formattedComment.at(-end - 1) &&
		end < commentText.length - start &&
		end < formattedComment.length - start
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
 * @returns  {object}
 *     The fixer replacement.
 */
export function replaceMinimalComment(fixer, comment, sourceText, formattedText) {
	const replacement = getMinimalCommentReplacement(comment, sourceText, formattedText);

	return fixer.replaceTextRange(replacement.range, replacement.text);
}

/**
 * Return whether a comment is an inline tool directive.
 *
 * @param  {object}  comment
 *     The comment token.
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
 * @returns  {string|null}
 *     The line indentation, or null when code precedes the offset.
 */
export function getLineIndent(sourceCode, offset) {
	const lineStart = getLineStart(sourceCode, offset);
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
 * @returns  {object}
 *     The previous and next non-comment source items.
 */
export function getCommentNeighbours(sourceCode, comment) {
	const sourceItems = sourceCode.tokensAndComments;
	const commentIndex = sourceItems.findIndex(
		(item) => item.range[0] === comment.range[0] && item.range[1] === comment.range[1],
	);
	let previous = null;
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
 * @returns  {object[][]}
 *     Adjacent line-comment groups.
 */
export function getLineCommentGroups(sourceCode) {
	const comments = sourceCode.getAllComments().filter((comment) => comment.type === "Line");
	const groups = [];

	for (const comment of comments) {
		if (isDirectiveComment(comment)) {
			continue;
		}

		const group = groups.at(-1);
		const previousComment = group?.at(-1);
		const gap = previousComment
			? sourceCode.text.slice(previousComment.range[1], comment.range[0])
			: "";
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
 * @returns  {boolean}
 *     Whether the comment is on a line of its own before code.
 */
export function isLeadingComment(sourceCode, comment, previous) {
	if (getLineIndent(sourceCode, comment.range[0]) === null) {
		return false;
	}

	return previous === null || comment.loc.start.line > previous.loc.end.line;
}
