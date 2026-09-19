import { formatJSDocPunctuation, formatJSDocWrapping, isJSDoc } from "../utils/jsdoc.js";

import {
	getCommentText,
	getDisplayWidth,
	getLineCommentGroups,
	getLineIndent,
	getLineStart,
	getNewline,
	isDirectiveComment,
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
		.map((line, index) => `${index === 0 ? "" : indentation}// ${line}`)
		.join(getNewline(sourceCode.text));
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
 * @param  {object}  comment
 *     The block comment token.
 * @param  {string}  commentText
 *     The sentence-formatted comment text to wrap.
 *
 * @returns  {string|null}
 *     The wrapped comment, or null when it is not a standalone comment.
 */
function formatBlockComment(sourceCode, comment, commentText) {
	// The comment's current indentation.
	const indentation = getLineIndent(sourceCode, comment.range[0]);

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
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The block comment token.
 * @param  {string}  commentText
 *     The formatted comment text.
 *
 * @returns  {string[]}
 *     The comment lines as they appear on screen.
 */
function getBlockCommentDisplayLines(sourceCode, comment, commentText) {
	// The comment's current indentation.
	const indentation = getLineIndent(sourceCode, comment.range[0]) ?? "";
	// The comment's individual source lines.
	const lines = commentText.split(/\r\n|\n|\r/);

	return [`${indentation}${lines[0]}`, ...lines.slice(1)];
}

/**
 * Report line-comment groups that need punctuation, reindentation or wrapping.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 */
function reportLineCommentGroups(context) {
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
		// The comments this rule may reindent or wrap; a leading comment that
		// trails code is left alone.
		const standaloneComments = commentGroup.slice(firstStandaloneIndex);

		// A stand-in for a comment token: replaceMinimalComment only reads its
		// range, and the range spans every standalone comment plus its
		// indentation.
		const groupToken = {
			range: [
				getLineStart(context.sourceCode, firstStandaloneComment.range[0]),
				commentGroup.at(-1).range[1],
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
		const formattedText = standaloneComments
			.map((comment, index) => {
				// The comment's value, using the group's first and last values.
				let value = comment.value;

				if (index === 0) {
					value = firstValue;
				} else if (index === standaloneComments.length - 1) {
					value = lastValue;
				}

				// The comment's source text after sentence formatting.
				const commentText = replaceLineCommentValue(context.sourceCode, comment, value);
				// The comment's text after applying the group's indentation.
				const reindentedText = `${firstIndent}${commentText}`;

				// The wrapped comment text, when the reindented line exceeds
				// the limit.
				const formattedComment =
					getDisplayWidth(reindentedText) > maximumLineLength
						? (formatLineComment(context.sourceCode, comment, firstIndent, commentText) ??
							commentText)
						: commentText;

				return `${firstIndent}${formattedComment}`;
			})
			.join(getNewline(context.sourceCode.text));

		if (formattedText === sourceText) {
			continue;
		}

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
			message: sentenceChanged
				? "Comment text must be a complete sentence."
				: "Format this comment.",
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
	for (const comment of context.sourceCode.getAllComments()) {
		if (comment.type === "Shebang" || comment.type === "Line" || isDirectiveComment(comment)) {
			continue;
		}

		// The comment's raw source text.
		const commentText = getCommentText(context.sourceCode, comment);

		// The comment after sentence capitalisation and punctuation.
		const punctuatedComment = isJSDoc(commentText)
			? formatJSDocPunctuation(context.sourceCode, comment)
			: formatOrdinaryBlockComment(context.sourceCode, comment);

		// The comment lines as they appear on screen after punctuation.
		const displayLines = getBlockCommentDisplayLines(
			context.sourceCode,
			comment,
			punctuatedComment,
		);

		// The comment, rewrapped when punctuation leaves a line over the limit.
		let formattedComment = punctuatedComment;

		if (displayLines.some((line) => getDisplayWidth(line) > maximumLineLength)) {
			formattedComment = isJSDoc(commentText)
				? formatJSDocWrapping(context.sourceCode, comment, punctuatedComment)
				: formatBlockComment(context.sourceCode, comment, punctuatedComment);
		}

		if (formattedComment === null || formattedComment === commentText) {
			continue;
		}

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
			fix: (fixer) => replaceMinimalComment(fixer, comment, commentText, formattedComment),
			message:
				punctuatedComment !== commentText
					? "Comment text must be a complete sentence."
					: "Format this comment.",
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
