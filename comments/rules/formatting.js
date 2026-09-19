import { formatJSDocWrapping, isJSDoc } from "../utils/jsdoc.js";

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

import { formatSentence, wrapWords } from "../utils/wrap.js";

// The line length this rule wraps comments to.
const maximumLineLength = 80;

/**
 * Wrap a line comment to the configured maximum width.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The line comment token.
 * @param  {string}  indentation
 *     The indentation shared by the comment group.
 *
 * @returns  {string|null}
 *     The wrapped comment without leading indentation, or null when it is a
 *     directive.
 */
function formatLineComment(sourceCode, comment, indentation) {
	// The available width, allowing for the indent and "// " prefix.
	const width = maximumLineLength - getDisplayWidth(indentation) - 3;
	// The comment's undecorated text.
	const text = comment.value.trim();

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
 * Wrap an ordinary block comment to the configured maximum width.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The block comment token.
 *
 * @returns  {string|null}
 *     The wrapped comment, or null when it is not a standalone comment.
 */
function formatBlockComment(sourceCode, comment) {
	// The comment's current indentation.
	const indentation = getLineIndent(sourceCode, comment.range[0]);

	if (indentation === null) {
		return null;
	}

	// The comment's raw source text.
	const commentText = getCommentText(sourceCode, comment);
	// The comment body, sentence-formatted.
	const text = formatSentence(commentText.slice(2, -2).trim());
	// The available width, allowing for the indent and " * " prefix.
	const width = maximumLineLength - getDisplayWidth(indentation) - 3;
	// The comment body, rewrapped to the available width.
	const lines = wrapWords(text, Math.max(1, width));

	return ["/*", ...lines.map((line) => `${indentation} * ${line}`), `${indentation} */`].join(
		getNewline(sourceCode.text),
	);
}

/**
 * Report line-comment groups that need reindentation or wrapping.
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

		// The group's text after reindentation and line wrapping.
		const formattedText = standaloneComments
			.map((comment) => {
				// The comment's source text without its line indentation.
				const commentText = getCommentText(context.sourceCode, comment);
				// The comment's text after applying the group's indentation.
				const reindentedText = `${firstIndent}${commentText}`;

				// The wrapped comment text, when the reindented line exceeds
				// the limit.
				const formattedComment =
					getDisplayWidth(reindentedText) > maximumLineLength
						? (formatLineComment(context.sourceCode, comment, firstIndent) ?? commentText)
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
			message: "Format this comment.",
			node: firstStandaloneComment,
		});
	}
}

/**
 * Report block comments that need wrapping.
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
		// The comment's individual source lines.
		const lines = commentText.split(/\r\n|\n|\r/);
		// The whitespace before the comment, absent when code precedes it.
		const indentation = getLineIndent(context.sourceCode, comment.range[0]) ?? "";
		// The comment lines as they appear on screen. The raw text omits the
		// first line's indentation, so it is restored before measuring.
		const displayLines = [`${indentation}${lines[0]}`, ...lines.slice(1)];

		if (!displayLines.some((line) => getDisplayWidth(line) > maximumLineLength)) {
			continue;
		}

		// The comment, rewrapped using the formatter matching its type.
		const formattedComment = isJSDoc(commentText)
			? formatJSDocWrapping(context.sourceCode, comment)
			: formatBlockComment(context.sourceCode, comment);

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
			message: "Format this comment.",
			node: comment,
		});
	}
}

/**
 * The comment-formatting rule: reindents line-comment groups and wraps any
 * comment past 80 columns, replacing each comment in one edit.
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
