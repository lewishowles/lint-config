import {
	formatJSDocBlockStructure,
	formatJSDocPunctuation,
	formatJSDocTagFormatting,
	formatJSDocWrapping,
	hasTargetJSDocTag,
	isJSDoc,
} from "../utils/jsdoc.js";

import {
	getCommentNeighbours,
	getCommentText,
	getDisplayWidth,
	getLineCommentGroups,
	getLineIndent,
	getLineStart,
	getNewline,
	isDirectiveComment,
	isLeadingComment,
	replaceMinimalComment,
} from "../utils/source.js";

import {
	addTerminalPunctuation,
	capitaliseSentence,
	formatSentence,
	wrapWords,
} from "../utils/wrap.js";

// The line length this rule wraps comments to.
const maximumLineLength = 80;

/**
 * Return a line comment's source text with a new value after the `//`.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The line comment token.
 * @param  {string}  value
 *     The replacement comment value.
 *
 * @returns  {string}
 *     The replacement comment text.
 */
function replaceLineCommentValue(sourceCode, comment, value) {
	// The comment's raw source text.
	const commentText = getCommentText(sourceCode, comment);

	return `${commentText.slice(0, 2)}${value}`;
}

/**
 * Wrap a line comment to the configured maximum width.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The line comment token.
 * @param  {string}  indentation
 *     The indentation shared by the comment group.
 * @param  {string}  commentText
 *     The comment text to wrap.
 *
 * @returns  {string|null}
 *     The wrapped comment without leading indentation, or null when it is a
 *     directive.
 */
function formatLineComment(sourceCode, comment, indentation, commentText) {
	// The available width, allowing for the indent and "// " prefix.
	const width = maximumLineLength - getDisplayWidth(indentation) - 3;
	// The comment's undecorated text.
	const text = commentText.slice(2).trim();

	if (isDirectiveComment(comment)) {
		return null;
	}

	if (text === "") {
		return "//";
	}

	return wrapWords(text, Math.max(1, width))
		.map((line) => `// ${line}`)
		.join(getNewline(sourceCode.text));
}

/**
 * Return the part of a line's indentation that goes beyond the comment's own
 * indentation, so nested lines keep their offset when the comment moves.
 *
 * @param  {string}  indentation
 *     The indentation of one line inside the comment.
 * @param  {string}  commentIndent
 *     The indentation of the comment's first line.
 *
 * @returns  {string}
 *     The extra indentation, or an empty string when the line does not start
 *     with the comment's indentation.
 */
function getRelativeIndent(indentation, commentIndent) {
	return indentation.startsWith(commentIndent) ? indentation.slice(commentIndent.length) : "";
}

/**
 * Reindent a formatted leading comment while preserving inner indentation.
 *
 * @param  {string}  commentText
 *     The formatted comment source text.
 * @param  {string}  commentIndent
 *     The comment's current indentation.
 * @param  {string}  expectedIndent
 *     The documented code's indentation.
 * @param  {string}  newline
 *     The source file's newline sequence.
 *
 * @returns  {string}
 *     The reindented comment with its leading indentation.
 */
function getReindentedCommentText(commentText, commentIndent, expectedIndent, newline) {
	return commentText
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
		.join(newline);
}

/**
 * Apply a prose formatter to a block-comment line, keeping its leading `*`.
 *
 * @param  {string}  line
 *     The block-comment line.
 * @param  {function}  formatProse
 *     The formatter for the line's prose.
 *
 * @returns  {string}
 *     The formatted block-comment line.
 */
function formatBlockCommentLine(line, formatProse) {
	// The line's leading `*` decoration, when present.
	const marker = line.match(/^\s*\*\s?/);

	if (marker === null) {
		return line;
	}

	return `${marker[0]}${formatProse(line.slice(marker[0].length).trim())}`;
}

/**
 * Format prose in an ordinary block comment as complete sentences.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The block comment token.
 *
 * @returns  {string}
 *     The sentence-formatted comment text.
 */
function formatOrdinaryBlockComment(sourceCode, comment) {
	// The comment's raw source text.
	const commentText = getCommentText(sourceCode, comment);
	// The indentation the comment's lines are aligned to.
	const indentation = getLineIndent(sourceCode, comment.range[0]);
	// The comment body, stripped of its /* */ delimiters.
	const content = commentText.slice(2, -2).trim();

	if (indentation === null || content === "" || isDirectiveComment(comment)) {
		return commentText;
	}

	if (!commentText.includes("\n") && !commentText.includes("\r")) {
		return `/* ${formatSentence(content)} */`;
	}

	// The comment's individual source lines.
	const lines = commentText.split(/\r\n|\n|\r/);

	// The indexes of lines carrying prose, excluding the delimiter lines.
	const proseLineIndexes = lines
		.slice(1, -1)
		.map((line, index) => ({ index: index + 1, text: line.replace(/^\s*\*?\s?/, "").trim() }))
		.filter((line) => line.text !== "")
		.map((line) => line.index);

	if (lines[0] === "/*" && lines.at(-1).trim() === "*/" && proseLineIndexes.length > 0) {
		// The comment lines, formatted in place.
		const formattedLines = [...lines];
		// The first prose line index, which starts the sentence.
		const firstProseLine = proseLineIndexes[0];
		// The last prose line index, which ends the sentence.
		const lastProseLine = proseLineIndexes.at(-1);

		formattedLines[firstProseLine] = formatBlockCommentLine(
			formattedLines[firstProseLine],
			capitaliseSentence,
		);
		formattedLines[lastProseLine] = formatBlockCommentLine(
			formattedLines[lastProseLine],
			addTerminalPunctuation,
		);

		return formattedLines.join(getNewline(sourceCode.text));
	}

	// The comment's prose, joined into a single paragraph.
	const paragraphs = content
		.split(/\r\n|\n|\r/)
		.map((line) => line.replace(/^\s*\*?\s?/, "").trim())
		.filter(Boolean)
		.join(" ");

	return ["/*", `${indentation} * ${formatSentence(paragraphs)}`, `${indentation} */`].join(
		getNewline(sourceCode.text),
	);
}

/**
 * Wrap an ordinary block comment to the configured maximum width.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {string}  commentText
 *     The sentence-formatted comment text to wrap.
 * @param  {string|null}  indentation
 *     The indentation used by the wrapped comment.
 *
 * @returns  {string|null}
 *     The wrapped comment, or null when it is not a standalone comment.
 */
function formatBlockComment(sourceCode, commentText, indentation) {
	if (indentation === null) {
		return null;
	}

	// The comment body, without its delimiters or line markers.
	const text = commentText
		.slice(2, -2)
		.split(/\r\n|\n|\r/)
		.map((line) => line.replace(/^\s*\*?\s?/, "").trim())
		.filter(Boolean)
		.join(" ");

	// The available width, allowing for the indent and " * " prefix.
	const width = maximumLineLength - getDisplayWidth(indentation) - 3;
	// The comment body, rewrapped to the available width.
	const lines = wrapWords(text, Math.max(1, width));

	return ["/*", ...lines.map((line) => `${indentation} * ${line}`), `${indentation} */`].join(
		getNewline(sourceCode.text),
	);
}

/**
 * Return the display lines for a formatted block comment.
 *
 * @param  {string}  commentText
 *     The formatted comment text.
 * @param  {string}  indentation
 *     The indentation used to measure the comment.
 *
 * @returns  {string[]}
 *     The comment lines as they appear on screen.
 */
function getBlockCommentDisplayLines(commentText, indentation) {
	// The comment's individual source lines.
	const lines = commentText.split(/\r\n|\n|\r/);

	return [`${indentation}${lines[0]}`, ...lines.slice(1)];
}

/**
 * Work out where a comment above code should sit: the code's indentation, and
 * the end of the gap to replace so exactly one line break separates them.
 *
 * The gap stops before a directive comment between the comment and its code, so
 * the fix never edits the directive. When an ordinary comment sits between them
 * instead, only the indentation is fixed and the gap is left alone.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The first comment in the formatted unit.
 * @param  {object}  lastComment
 *     The last comment in the formatted unit.
 * @param  {object[]}  comments
 *     Every comment token in source order.
 *
 * @returns  {object|null}
 *     Placement details with `actualIndent`, `changed`, `expectedIndent`,
 *     `gap`, and `rangeEnd`; or null when the comment does not sit above code.
 */
function getLeadingCommentPlacement(sourceCode, comment, lastComment, comments) {
	// The code token the comment documents, and the token before the comment.
	const { next, previous } = getCommentNeighbours(sourceCode, comment);

	if (next === null || !isLeadingComment(sourceCode, comment, previous)) {
		return null;
	}

	// The indentation required by the documented source token.
	const expectedIndent = getLineIndent(sourceCode, next.range[0]);
	// The comment's current indentation.
	const actualIndent = getLineIndent(sourceCode, comment.range[0]);

	if (expectedIndent === null || actualIndent === null) {
		return null;
	}

	// The next comment after this unit, when one exists.
	const followingComment = comments.find((candidate) => candidate.range[0] > lastComment.range[1]);

	// Whether another comment sits between this one and its documented code.
	const followingCommentIntervenes =
		followingComment !== undefined && followingComment.range[0] <= next.range[0];

	if (followingCommentIntervenes && !isDirectiveComment(followingComment)) {
		return {
			actualIndent,
			changed: actualIndent !== expectedIndent,
			expectedIndent,
			gap: "",
			rangeEnd: lastComment.range[1],
		};
	}

	// Stop before an intervening directive so the replacement never overlaps
	// it.
	const rangeEnd = followingCommentIntervenes ? followingComment.range[0] : next.range[0];
	// The source gap after the final comment, up to the code or directive.
	const sourceGap = sourceCode.text.slice(lastComment.range[1], rangeEnd);
	// The gap the documented code's indentation requires.
	const gap = `${getNewline(sourceCode.text)}${expectedIndent}`;

	return {
		actualIndent,
		changed: actualIndent !== expectedIndent || sourceGap !== gap,
		expectedIndent,
		gap,
		rangeEnd,
	};
}

/**
 * Return the diagnostic message for a comment formatting report.
 *
 * @param  {boolean}  sentenceChanged
 *     Whether the comment's sentence punctuation needs changing.
 * @param  {boolean}  placementChanged
 *     Whether the comment's placement needs changing.
 *
 * @returns  {string}
 *     The diagnostic message.
 */
function getReportMessage(sentenceChanged, placementChanged) {
	if (sentenceChanged) {
		return "Comment text must be a complete sentence.";
	}

	if (placementChanged) {
		return "Comment must be immediately before the documented code.";
	}

	return "Format this comment.";
}

/**
 * Report line-comment groups that need punctuation, reindentation or wrapping.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 */
function reportLineCommentGroups(context) {
	// Every comment in the file, used to find what follows each group.
	const comments = context.sourceCode.getAllComments();

	for (const commentGroup of getLineCommentGroups(context.sourceCode)) {
		// The first standalone comment is the group leader for formatting.
		const firstStandaloneIndex = commentGroup.findIndex(
			(comment) => getLineIndent(context.sourceCode, comment.range[0]) !== null,
		);

		if (firstStandaloneIndex < 0) {
			continue;
		}

		// The comment whose indentation the rest of the group follows.
		const firstStandaloneComment = commentGroup[firstStandaloneIndex];
		// The indentation applied to every standalone comment in the group.
		const firstIndent = getLineIndent(context.sourceCode, firstStandaloneComment.range[0]);

		// The placement of a leading group, when it documents the next token.
		const placement = getLeadingCommentPlacement(
			context.sourceCode,
			firstStandaloneComment,
			commentGroup.at(-1),
			comments,
		);

		// The indentation applied to the comment group's replacement.
		const expectedIndent = placement?.expectedIndent ?? firstIndent;
		// The comments this rule may reindent or wrap; a leading comment that
		// trails code is left alone.
		const standaloneComments = commentGroup.slice(firstStandaloneIndex);

		// A stand-in for a comment token: replaceMinimalComment only reads its
		// range, and the range spans every standalone comment plus its
		// indentation.
		const groupToken = {
			range: [
				getLineStart(context.sourceCode, firstStandaloneComment.range[0]),
				placement?.rangeEnd ?? commentGroup.at(-1).range[1],
			],
		};

		// The group's current source text.
		const sourceText = context.sourceCode.text.slice(...groupToken.range);
		// The first comment's undecorated text.
		const firstText = standaloneComments[0].value.trim();
		// Whether sentence punctuation applies to this group.
		const formatPunctuation = firstText !== "" && !firstText.startsWith("@");

		// The first comment's value, formatted as a sentence when needed.
		let firstValue = standaloneComments[0].value;
		// The last comment's value, given a full stop when punctuation applies.
		let lastValue = standaloneComments.at(-1).value;

		if (formatPunctuation) {
			if (standaloneComments.length === 1) {
				firstValue = formatSentence(firstValue);
				lastValue = firstValue;
			} else {
				firstValue = capitaliseSentence(firstValue);
				lastValue = addTerminalPunctuation(lastValue);
			}
		}

		// Whether sentence punctuation changes the group.
		const sentenceChanged =
			formatPunctuation &&
			(firstValue !== standaloneComments[0].value || lastValue !== standaloneComments.at(-1).value);

		// The group's text after punctuation, reindentation, and line wrapping.
		const formattedText =
			standaloneComments
				.map((comment, index) => {
					// The comment's value, using the group's first and last
					// values.
					let value = comment.value;

					if (index === 0) {
						value = firstValue;
					} else if (index === standaloneComments.length - 1) {
						value = lastValue;
					}

					// The comment's source text after sentence formatting.
					const commentText = replaceLineCommentValue(context.sourceCode, comment, value);
					// The comment's current indentation, falling back to the
					// leader's.
					const commentIndent = getLineIndent(context.sourceCode, comment.range[0]) ?? firstIndent;
					// The comment's extra indentation beyond the group
					// leader's.
					const relativeIndent = getRelativeIndent(commentIndent, firstIndent);
					// The indentation this comment gets once the group is
					// moved.
					const commentExpectedIndent = expectedIndent + relativeIndent;
					// The comment's text after applying the group's
					// indentation.
					const reindentedText = `${commentExpectedIndent}${commentText}`;

					// The wrapped comment text, when the reindented line
					// exceeds
					// the limit.
					const formattedComment =
						getDisplayWidth(reindentedText) > maximumLineLength
							? (formatLineComment(
									context.sourceCode,
									comment,
									commentExpectedIndent,
									commentText,
								) ?? commentText)
							: commentText;

					return formattedComment
						.split(getNewline(context.sourceCode.text))
						.map((line) => `${commentExpectedIndent}${line}`)
						.join(getNewline(context.sourceCode.text));
				})
				.join(getNewline(context.sourceCode.text)) + (placement?.gap ?? "");

		if (formattedText === sourceText) {
			continue;
		}

		// The diagnostic message for the group's changes.
		const message = getReportMessage(sentenceChanged, placement?.changed ?? false);

		context.report({
			/**
			 * Apply the group's combined formatting fix.
			 *
			 * @param  {object}  fixer
			 *     The Oxlint fixer.
			 *
			 * @returns  {object}
			 *     The fix for the complete comment group.
			 */
			fix: (fixer) => replaceMinimalComment(fixer, groupToken, sourceText, formattedText),
			message,
			node: firstStandaloneComment,
		});
	}
}

/**
 * Report block comments that need punctuation or wrapping.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 */
function reportBlockComments(context) {
	// Every comment in the file, used to find what follows each comment.
	const comments = context.sourceCode.getAllComments();

	for (const comment of comments) {
		if (comment.type === "Shebang" || comment.type === "Line" || isDirectiveComment(comment)) {
			continue;
		}

		// The comment's raw source text.
		const commentText = getCommentText(context.sourceCode, comment);
		// The placement of a leading comment, when it documents the next token.
		const placement = getLeadingCommentPlacement(context.sourceCode, comment, comment, comments);
		// The comment's current indentation, or an empty string for inline
		// comments.
		const actualIndent = getLineIndent(context.sourceCode, comment.range[0]) ?? "";
		// The indentation the formatted comment should use.
		const expectedIndent = placement?.expectedIndent ?? actualIndent;

		// The comment with its layout and sentence punctuation fixed, before
		// wrapping.
		let punctuatedComment;
		// Whether fixing sentence capitalisation or punctuation changed the
		// comment.
		let sentenceChanged;

		// The indentation and newline style that the JSDoc formatters keep.
		const jsdocLayout = {
			indent: expectedIndent,
			newline: getNewline(context.sourceCode.text),
		};

		if (isJSDoc(commentText)) {
			// The JSDoc comment with its block structure fixed before tag
			// formatting.
			const structuredComment = formatJSDocBlockStructure(commentText, jsdocLayout);

			// The JSDoc comment with its tags spaced, ordered, and grouped.
			// Comments
			// without the tags this formats keep their prose line breaks.
			const laidOutComment = hasTargetJSDocTag(commentText)
				? formatJSDocTagFormatting(structuredComment, jsdocLayout)
				: structuredComment;

			punctuatedComment = formatJSDocPunctuation(laidOutComment, jsdocLayout);
			sentenceChanged = punctuatedComment !== laidOutComment;
		} else {
			punctuatedComment = formatOrdinaryBlockComment(context.sourceCode, comment);
			sentenceChanged = punctuatedComment !== commentText;
		}

		// The comment lines as they appear on screen after punctuation.
		const displayLines = getBlockCommentDisplayLines(punctuatedComment, expectedIndent);

		// The comment, rewrapped when punctuation leaves a line over the limit.
		let formattedComment = punctuatedComment;

		// Whether any formatted line exceeds the width limit.
		const hasOverlongLine = displayLines.some((line) => getDisplayWidth(line) > maximumLineLength);

		if (hasOverlongLine) {
			if (isJSDoc(commentText)) {
				formattedComment = formatJSDocWrapping(punctuatedComment, jsdocLayout);
			} else {
				formattedComment = formatBlockComment(
					context.sourceCode,
					punctuatedComment,
					expectedIndent,
				);
			}
		}

		if (formattedComment === null || formattedComment === commentText) {
			if (placement === null || !placement.changed) {
				continue;
			}
		}

		// The indentation the formatted comment was built with. JSDoc and
		// rewrapped comments use the new indentation; other comments keep
		// their current one until they are moved below.
		const formattedIndent = isJSDoc(commentText) || hasOverlongLine ? expectedIndent : actualIndent;

		// The formatted comment text with its leading indentation.
		const replacementComment =
			placement === null
				? formattedComment
				: getReindentedCommentText(
						formattedComment,
						formattedIndent,
						expectedIndent,
						getNewline(context.sourceCode.text),
					);

		// The source range includes the comment's line start and its placement
		// gap.
		const replacementToken =
			placement === null
				? comment
				: { range: [getLineStart(context.sourceCode, comment.range[0]), placement.rangeEnd] };

		// The current source text for the complete replacement.
		const sourceText = getCommentText(context.sourceCode, replacementToken);
		// The replacement text, including the required gap before code or a
		// directive.
		const replacementText = `${replacementComment}${placement?.gap ?? ""}`;
		// The diagnostic message for the comment's changes.
		const message = getReportMessage(sentenceChanged, placement?.changed ?? false);

		context.report({
			/**
			 * Apply the wrapped replacement to the comment.
			 *
			 * @param  {object}  fixer
			 *     The Oxlint fixer.
			 *
			 * @returns  {object}
			 *     The fix to apply.
			 */
			fix: (fixer) => replaceMinimalComment(fixer, replacementToken, sourceText, replacementText),
			message,
			node: comment,
		});
	}
}

/**
 * The comment-formatting rule: punctuates comments as sentences, reindents
 * line-comment groups and wraps any comment past 80 columns, replacing each
 * comment in one edit.
 */
export default {
	meta: {
		docs: { description: "Format comments to the configured layout." },
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
			 * Format every non-directive comment in the file.
			 */
			Program() {
				reportLineCommentGroups(context);
				reportBlockComments(context);
			},
		};
	},
};
