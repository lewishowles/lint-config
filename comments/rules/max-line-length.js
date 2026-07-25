import { formatJSDocComment, isJSDoc } from "../utils/jsdoc.js";
import { getCommentText, getLineIndent, getNewline } from "../utils/source.js";
import { wrapWords } from "../utils/wrap.js";

const maximumLineLength = 80;

/**
 * Wrap a line comment to the configured maximum width.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The line comment token.
 * @returns  {string|null}
 *     The wrapped comment, or null when it is not a standalone comment.
 */
function formatLineComment(sourceCode, comment) {
	const indentation = getLineIndent(sourceCode, comment.range[0]);

	if (indentation === null) {
		return null;
	}

	const width = maximumLineLength - indentation.length - 3;
	const text = comment.value.trim();

	if (/^(?:eslint|oxlint|istanbul|c8)-/.test(text)) {
		return null;
	}

	if (text === "") {
		return `${indentation}//`;
	}

	return wrapWords(text, Math.max(1, width))
		.map((line) => `${indentation}// ${line}`)
		.join(getNewline(sourceCode.text));
}

/**
 * Wrap an ordinary block comment to the configured maximum width.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The block comment token.
 * @returns  {string|null}
 *     The wrapped comment, or null when it is not a standalone comment.
 */
function formatBlockComment(sourceCode, comment) {
	const indentation = getLineIndent(sourceCode, comment.range[0]);

	if (indentation === null) {
		return null;
	}

	const commentText = getCommentText(sourceCode, comment);
	const text = commentText.slice(2, -2).trim();
	const width = maximumLineLength - indentation.length - 3;
	const lines = wrapWords(text, Math.max(1, width));

	return [
		`${indentation}/*`,
		...lines.map((line) => `${indentation} * ${line}`),
		`${indentation} */`,
	].join(getNewline(sourceCode.text));
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
	createOnce(context) {
		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (comment.type === "Shebang") {
						continue;
					}

					const commentText = getCommentText(context.sourceCode, comment);
					const lines = commentText.split(/\r\n|\n|\r/);

					if (!lines.some((line) => line.length > maximumLineLength)) {
						continue;
					}

					const formattedComment =
						comment.type === "Line"
							? formatLineComment(context.sourceCode, comment)
							: isJSDoc(commentText)
								? formatJSDocComment(context.sourceCode, comment, { normaliseTags: false })
								: formatBlockComment(context.sourceCode, comment);

					if (formattedComment === null || formattedComment === commentText) {
						continue;
					}

					context.report({
						fix: (fixer) => fixer.replaceText(comment, formattedComment),
						message: "Comment exceeds 80 characters.",
						node: comment,
					});
				}
			},
		};
	},
};
