import { addTerminalPunctuation, capitaliseSentence, formatSentence } from "../utils/wrap.js";
import { formatJSDocComment, isJSDoc } from "../utils/jsdoc.js";
import {
	getCommentText,
	getLineCommentGroups,
	getLineIndent,
	getNewline,
	isDirectiveComment,
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
 * @returns  {string}
 *     The replacement comment text.
 */
function replaceLineCommentValue(sourceCode, comment, value) {
	const commentText = getCommentText(sourceCode, comment);

	return `${commentText.slice(0, 2)}${value}`;
}

/**
 * Format the prose text in a standard block-comment line.
 *
 * @param  {string}  line
 *     The block-comment line.
 * @param  {Function}  format
 *     The sentence formatter.
 * @returns  {string}
 *     The formatted block-comment line.
 */
function formatBlockCommentLine(line, format) {
	const marker = line.match(/^\s*\*\s?/);

	if (marker === null) {
		return line;
	}

	return `${marker[0]}${format(line.slice(marker[0].length).trim())}`;
}

/**
 * Return a sentence-formatted line-comment group.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object[]}  comments
 *     The adjacent line comments.
 * @returns  {object|null}
 *     The first and last replacements, or null when no sentence needs work.
 */
function formatLineCommentGroup(sourceCode, comments) {
	const firstComment = comments[0];
	const lastComment = comments.at(-1);
	const firstText = firstComment.value.trim();
	const lastText = lastComment.value.trim();

	if (
		firstText === "" ||
		firstText.startsWith("@") ||
		/^(?:eslint|oxlint|istanbul|c8)-/.test(firstText)
	) {
		return null;
	}

	const firstValue =
		comments.length === 1
			? formatSentence(firstComment.value)
			: capitaliseSentence(firstComment.value);
	const lastValue = comments.length === 1 ? firstValue : addTerminalPunctuation(lastComment.value);
	const firstReplacement = replaceLineCommentValue(sourceCode, firstComment, firstValue);
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
 * @returns  {string}
 *     The sentence-formatted comment text.
 */
function formatOrdinaryBlockComment(sourceCode, comment) {
	const commentText = getCommentText(sourceCode, comment);
	const indentation = getLineIndent(sourceCode, comment.range[0]);
	const content = commentText.slice(2, -2).trim();

	if (indentation === null || content === "" || /^(?:eslint|oxlint|istanbul|c8)-/.test(content)) {
		return commentText;
	}

	if (!commentText.includes("\n") && !commentText.includes("\r")) {
		return `/* ${formatSentence(content)} */`;
	}

	const lines = commentText.split(/\r\n|\n|\r/);
	const proseLineIndexes = lines
		.slice(1, -1)
		.map((line, index) => ({ index: index + 1, text: line.replace(/^\s*\*?\s?/, "").trim() }))
		.filter((line) => line.text !== "")
		.map((line) => line.index);

	if (lines[0] === "/*" && lines.at(-1).trim() === "*/" && proseLineIndexes.length > 0) {
		const formattedLines = [...lines];
		const firstProseLine = proseLineIndexes[0];
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

	const paragraphs = content
		.split(/\r\n|\n|\r/)
		.map((line) => line.replace(/^\s*\*?\s?/, "").trim())
		.filter(Boolean)
		.join(" ");

	return [
		"/*",
		`${indentation} * ${formatSentence(paragraphs)}`,
		`${indentation} */`,
	].join(getNewline(sourceCode.text));
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
	createOnce(context) {
		return {
			Program() {
				for (const comments of getLineCommentGroups(context.sourceCode)) {
					const commentGroup = comments.filter((comment) => !isDirectiveComment(comment));

					if (commentGroup.length === 0) {
						continue;
					}

					const formattedGroup = formatLineCommentGroup(context.sourceCode, commentGroup);

					if (formattedGroup) {
						context.report({
							fix: (fixer) => {
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

					const commentText = getCommentText(context.sourceCode, comment);
					const formattedComment = isJSDoc(commentText)
						? formatJSDocComment(context.sourceCode, comment, {
								addPunctuation: true,
								normaliseTagSeparator: false,
								normaliseTags: false,
								wrap: false,
							})
						: formatOrdinaryBlockComment(context.sourceCode, comment);

					if (formattedComment !== commentText) {
						context.report({
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
