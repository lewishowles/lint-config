import { addTerminalPunctuation, capitaliseSentence, formatSentence } from "../utils/wrap.js";
import { formatJSDocPunctuation, isJSDoc } from "../utils/jsdoc.js";
import {
	getCommentText,
	getLineCommentGroups,
	getLineIndent,
	getNewline,
	replaceMinimalComment,
} from "../utils/source.js";

/**
 * Replace only the value of a line comment.
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
 * Format the prose text in a standard block-comment line.
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
 * Return a sentence-formatted line-comment group.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object[]}  comments
 *     The adjacent line comments.
 *
 * @returns  {object|null}
 *     The first and last replacements, or null when no sentence needs work.
 */
function formatLineCommentGroup(sourceCode, comments) {
	// The group's first comment token.
	const firstComment = comments[0];
	// The group's last comment token.
	const lastComment = comments.at(-1);
	// The first comment's undecorated text.
	const firstText = firstComment.value.trim();

	if (firstText === "" || firstText.startsWith("@")) {
		return null;
	}

	// The first comment's value, capitalised or fully sentence-formatted.
	const firstValue =
		comments.length === 1
			? formatSentence(firstComment.value)
			: capitaliseSentence(firstComment.value);

	// The last comment's value, punctuated to close the sentence.
	const lastValue = comments.length === 1 ? firstValue : addTerminalPunctuation(lastComment.value);
	// The replacement comment text for the first and last comments.
	const firstReplacement = replaceLineCommentValue(sourceCode, firstComment, firstValue);
	// The replacement comment text for the last comment.
	const lastReplacement = replaceLineCommentValue(sourceCode, lastComment, lastValue);

	if (
		firstReplacement === getCommentText(sourceCode, firstComment) &&
		lastReplacement === getCommentText(sourceCode, lastComment)
	) {
		return null;
	}

	return { firstComment, firstReplacement, lastComment, lastReplacement };
}

/**
 * Format prose in an ordinary block comment.
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

	if (indentation === null || content === "" || /^(?:eslint|oxlint|istanbul|c8)-/.test(content)) {
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
		// The first and last prose line indexes, which start and end the sentence.
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
 * Create the complete-sentence comment rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Format existing comments as complete sentences." },
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
			 * Format every comment in the file as a complete sentence.
			 */
			Program() {
				for (const commentGroup of getLineCommentGroups(context.sourceCode)) {
					// The group's replacement text, or null when it already reads as a sentence.
					const formattedGroup = formatLineCommentGroup(context.sourceCode, commentGroup);

					if (formattedGroup) {
						context.report({
							/**
							 * Apply the formatted replacement to the comment group.
							 *
							 * @param  {object}  fixer
							 *     The Oxlint fixer.
							 *
							 * @returns  {object[]}
							 *     The fixes to apply.
							 */
							fix: (fixer) => {
								// The fixes to apply, starting with the first comment's replacement.
								const fixes = [
									replaceMinimalComment(
										fixer,
										formattedGroup.firstComment,
										getCommentText(context.sourceCode, formattedGroup.firstComment),
										formattedGroup.firstReplacement,
									),
								];

								if (formattedGroup.lastComment.range[0] !== formattedGroup.firstComment.range[0]) {
									fixes.push(
										replaceMinimalComment(
											fixer,
											formattedGroup.lastComment,
											getCommentText(context.sourceCode, formattedGroup.lastComment),
											formattedGroup.lastReplacement,
										),
									);
								}

								return fixes;
							},
							message: "Comment text must be a complete sentence.",
							node: formattedGroup.firstComment,
						});
					}
				}

				for (const comment of context.sourceCode.getAllComments()) {
					if (comment.type !== "Block") {
						continue;
					}

					// The comment's raw source text.
					const commentText = getCommentText(context.sourceCode, comment);

					// The comment, sentence-formatted using the JSDoc or ordinary-block formatter.
					const formattedComment = isJSDoc(commentText)
						? formatJSDocPunctuation(context.sourceCode, comment)
						: formatOrdinaryBlockComment(context.sourceCode, comment);

					if (formattedComment !== commentText) {
						context.report({
							/**
							 * Apply the sentence-formatted replacement to the comment.
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
							message: "Comment text must be a complete sentence.",
							node: comment,
						});
					}
				}
			},
		};
	},
};
