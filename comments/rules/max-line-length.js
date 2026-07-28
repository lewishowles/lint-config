import { formatJSDocWrapping, isJSDoc } from "../utils/jsdoc.js";

import {
	getCommentText,
	getLineIndent,
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
 *
 * @returns  {string|null}
 *     The wrapped comment, or null when it is not a standalone comment.
 */
function formatLineComment(sourceCode, comment) {
	// The comment's current indentation.
	const indentation = getLineIndent(sourceCode, comment.range[0]);

	if (indentation === null) {
		return null;
	}

	// The available width, allowing for the indent and "// " prefix.
	const width = maximumLineLength - indentation.length - 3;
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
	const width = maximumLineLength - indentation.length - 3;
	// The comment body, rewrapped to the available width.
	const lines = wrapWords(text, Math.max(1, width));

	return ["/*", ...lines.map((line) => `${indentation} * ${line}`), `${indentation} */`].join(
		getNewline(sourceCode.text),
	);
}

/**
 * Create the maximum-line-length rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Wrap comments at 80 characters." },
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
			 * Wrap every over-length comment in the file.
			 */
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (comment.type === "Shebang") {
						continue;
					}

					// The comment's raw source text.
					const commentText = getCommentText(context.sourceCode, comment);
					// The comment's individual source lines.
					const lines = commentText.split(/\r\n|\n|\r/);

					if (!lines.some((line) => line.length > maximumLineLength)) {
						continue;
					}

					// The comment, rewrapped using the formatter matching its type.
					const formattedComment =
						comment.type === "Line"
							? formatLineComment(context.sourceCode, comment)
							: isJSDoc(commentText)
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
						fix: (fixer) => {
							return replaceMinimalComment(fixer, comment, commentText, formattedComment);
						},
						message: "Comment exceeds 80 characters.",
						node: comment,
					});
				}
			},
		};
	},
};
