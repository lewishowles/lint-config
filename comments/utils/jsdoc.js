import { getCommentText, getLineIndent, getNewline } from "./source.js";
import { addTerminalPunctuation, capitaliseSentence, formatSentence, wrapWords } from "./wrap.js";

const tagOrder = ["param", "throws", "returns"];
const preservedSectionTags = new Set(["example"]);
const targetTags = new Set(tagOrder);

/**
 * Return whether source text is a JSDoc-style block comment.
 *
 * @param  {string}  commentText
 *     The comment source text.
 * @returns  {boolean}
 *     Whether the comment starts with JSDoc syntax.
 */
export function isJSDoc(commentText) {
	return commentText.startsWith("/**");
}

/**
 * Read the undecorated content lines of a JSDoc comment.
 *
 * @param  {string}  commentText
 *     The comment source text.
 * @returns  {string[]}
 *     The comment content lines.
 */
export function getJSDocContent(commentText) {
	const body = commentText.slice(3, -2);
	const lines = body.split(/\r\n|\n|\r/).map((line) => {
		if (/^\s*\*/.test(line)) {
			return line.replace(/^\s*\* ?/, "");
		}

		return line.trim();
	});

	while (lines[0] === "") {
		lines.shift();
	}

	while (lines.at(-1) === "") {
		lines.pop();
	}

	return lines;
}

/**
 * Split JSDoc content into prose and tag lines.
 *
 * @param  {string[]}  contentLines
 *     The undecorated comment content.
 * @returns  {object}
 *     Prose and tag content.
 */
function splitJSDocContent(contentLines) {
	const firstTagIndex = contentLines.findIndex((line) => /^@\w+\b/.test(line.trim()));

	if (firstTagIndex < 0) {
		return { proseLines: contentLines, tagLines: [] };
	}

	return {
		proseLines: contentLines.slice(0, firstTagIndex),
		tagLines: contentLines.slice(firstTagIndex),
	};
}

/**
 * Return the tag name at the beginning of a JSDoc line.
 *
 * @param  {string}  line
 *     The undecorated JSDoc line.
 * @returns  {string|null}
 *     The tag name, or null when the line is not a tag.
 */
function getJSDocTagName(line) {
	const match = line.trim().match(/^@([a-zA-Z][\w-]*)\b/);

	return match?.[1] ?? null;
}

/**
 * Return whether a line is a target JSDoc tag.
 *
 * @param  {string}  line
 *     The undecorated JSDoc line.
 * @returns  {boolean}
 *     Whether the line is one of the Phase 1 tags.
 */
function isTargetTag(line) {
	const tagName = getJSDocTagName(line);

	return tagName !== null && targetTags.has(tagName);
}

/**
 * Return whether a JSDoc tag starts a section whose content stays verbatim.
 *
 * @param  {string}  line
 *     The undecorated JSDoc line.
 * @returns  {boolean}
 *     Whether the line starts a preserved section.
 */
function isPreservedSectionTag(line) {
	return preservedSectionTags.has(getJSDocTagName(line));
}

/**
 * Parse target JSDoc tag entries.
 *
 * @param  {string[]}  tagLines
 *     The undecorated tag content.
 * @returns  {object[]}
 *     Parsed target tag entries.
 */
function parseTargetTags(tagLines) {
	const entries = [];
	let currentEntry = null;

	for (const line of tagLines) {
		const match = line.trim().match(/^@(param|throws|returns)\b(.*)$/);

		if (match) {
			currentEntry = {
				description: [],
				rest: match[2].trim(),
				type: match[1],
			};
			entries.push(currentEntry);
		} else if (currentEntry) {
			currentEntry.description.push(line);
		}
	}

	return entries;
}

/**
 * Format a target JSDoc tag header.
 *
 * @param  {object}  entry
 *     The parsed tag entry.
 * @returns  {string}
 *     The aligned tag header.
 */
function formatTagHeader(entry) {
	const typeMatch = entry.rest.match(/^(\{[^}]+\})(?:\s+(\S+))?(?:\s+(.*))?$/);

	if (!typeMatch) {
		return `@${entry.type}  ${entry.rest}`.trimEnd();
	}

	const type = typeMatch[1];
	const name = typeMatch[2];

	if (entry.type === "param" && name) {
		return `@param  ${type}  ${name}`;
	}

	return `@${entry.type}  ${type}`;
}

/**
 * Return the inline description from a target tag.
 *
 * @param  {object}  entry
 *     The parsed tag entry.
 * @returns  {string}
 *     The inline description, when present.
 */
function getInlineTagDescription(entry) {
	const typeMatch = entry.rest.match(/^(\{[^}]+\})(?:\s+(\S+))?(?:\s+(.*))?$/);

	return typeMatch?.[3] ?? "";
}

/**
 * Format prose without changing its existing line wrapping.
 *
 * @param  {string[]}  lines
 *     The prose content lines.
 * @param  {boolean}  addPunctuation
 *     Whether to format each paragraph as a sentence.
 * @returns  {string[]}
 *     The formatted prose lines.
 */
function formatUnwrappedProse(lines, addPunctuation) {
	const result = lines.map((line) => line.trim());
	let paragraphStart = null;

	for (let index = 0; index <= result.length; index += 1) {
		if (index < result.length && result[index] !== "") {
			if (paragraphStart === null) {
				paragraphStart = index;
			}

			continue;
		}

		if (paragraphStart !== null && addPunctuation) {
			result[paragraphStart] = capitaliseSentence(result[paragraphStart]);
			result[index - 1] = addTerminalPunctuation(result[index - 1]);
		}

		paragraphStart = null;
	}

	return result;
}

/**
 * Format prose paragraphs to the block-comment width.
 *
 * @param  {string[]}  lines
 *     The prose content lines.
 * @param  {number}  width
 *     The available content width.
 * @param  {boolean}  addPunctuation
 *     Whether to format each paragraph as a sentence.
 * @param  {boolean}  wrap
 *     Whether to wrap paragraphs.
 * @returns  {string[]}
 *     Formatted prose content lines.
 */
function formatProse(lines, width, addPunctuation, wrap) {
	if (!wrap) {
		return formatUnwrappedProse(lines, addPunctuation);
	}

	const result = [];
	let paragraph = [];

	const flushParagraph = () => {
		if (paragraph.length === 0) {
			return;
		}

		let text = paragraph.join(" ").trim();

		if (addPunctuation) {
			text = formatSentence(text);
		}

		result.push(...wrapWords(text, width));
		paragraph = [];
	};

	for (const line of lines) {
		if (line.trim() === "") {
			flushParagraph();
			if (result.at(-1) !== "") {
				result.push("");
			}
		} else {
			paragraph.push(line.trim());
		}
	}

	flushParagraph();

	while (result.at(-1) === "") {
		result.pop();
	}

	return result;
}

/**
 * Format the target JSDoc tags, including their group order.
 *
 * @param  {string[]}  tagLines
 *     The undecorated tag content.
 * @param  {number}  width
 *     The available description width.
 * @param  {boolean}  addPunctuation
 *     Whether to format tag descriptions as sentences.
 * @param  {boolean}  normaliseTags
 *     Whether to normalise tag spacing and group order.
 * @returns  {string[]}
 *     Formatted tag content lines.
 */
function formatTags(tagLines, width, addPunctuation, normaliseTags) {
	const entries = parseTargetTags(tagLines);
	const hasUnknownTag = tagLines.some((line) => line.trim().startsWith("@") && !isTargetTag(line));

	if (!normaliseTags || entries.length === 0) {
		return formatTagDescriptions(tagLines, width, addPunctuation);
	}

	if (hasUnknownTag) {
		return formatMixedTags(tagLines, width, addPunctuation);
	}

	const result = [];
	let lastType = null;
	const orderedEntries = tagOrder.flatMap((type) => entries.filter((entry) => entry.type === type));

	for (const entry of orderedEntries) {
		if (lastType !== null && lastType !== entry.type) {
			result.push("");
		}

		result.push(formatTagHeader(entry));
		const description = [getInlineTagDescription(entry), ...entry.description]
			.filter((line) => line.trim() !== "")
			.map((line) => line.trim());
		let descriptionText = description.join(" ");

		if (addPunctuation && descriptionText !== "") {
			descriptionText = formatSentence(descriptionText);
		}

		if (descriptionText !== "") {
			result.push(...wrapWords(descriptionText, width).map((line) => `    ${line}`));
		}

		lastType = entry.type;
	}

	return result;
}

/**
 * Format target tags in place when a JSDoc block also has other tags.
 *
 * @param  {string[]}  lines
 *     The undecorated tag content lines.
 * @param  {number}  width
 *     The available description width.
 * @param  {boolean}  addPunctuation
 *     Whether to format descriptions as sentences.
 * @returns  {string[]}
 *     Formatted mixed tag content lines.
 */
function formatMixedTags(lines, width, addPunctuation) {
	const result = [];
	let currentEntry = null;
	let preserveSection = false;

	for (const line of lines) {
		const tagName = getJSDocTagName(line);
		const match = line.trim().match(/^@(param|throws|returns)\b(.*)$/);

		if (match) {
			currentEntry = {
				description: [],
				rest: match[2].trim(),
				type: match[1],
			};
			preserveSection = false;
			result.push(formatTagHeader(currentEntry));
		} else if (tagName !== null) {
			currentEntry = null;
			preserveSection = isPreservedSectionTag(line);
			result.push(line.trim());
		} else if (preserveSection) {
			result.push(line);
		} else if (line.trim() === "") {
			currentEntry = null;
			if (result.at(-1) !== "") {
				result.push("");
			}
		} else {
			let text = line.trim();

			if (addPunctuation && currentEntry) {
				text = formatSentence(text);
			}

			result.push(...wrapWords(text, width).map((wrappedLine) => `    ${wrappedLine}`));
		}
	}

	while (result.at(-1) === "") {
		result.pop();
	}

	return result;
}

/**
 * Format descriptions while retaining non-target tag lines.
 *
 * @param  {string[]}  lines
 *     The undecorated tag content lines.
 * @param  {number}  width
 *     The available description width.
 * @param  {boolean}  addPunctuation
 *     Whether to format descriptions as sentences.
 * @returns  {string[]}
 *     Formatted tag content lines.
 */
function formatTagDescriptions(lines, width, addPunctuation) {
	const result = [];
	let description = [];
	let preserveSection = false;

	const flushDescription = () => {
		if (description.length === 0) {
			return;
		}

		let text = description.join(" ").trim();

		if (addPunctuation) {
			text = formatSentence(text);
		}

		result.push(...wrapWords(text, width).map((line) => `    ${line}`));
		description = [];
	};

	for (const line of lines) {
		const tagName = getJSDocTagName(line);

		if (tagName !== null) {
			flushDescription();
			result.push(line.trim());
			preserveSection = isPreservedSectionTag(line);
		} else if (preserveSection) {
			result.push(line);
		} else if (line.trim() === "") {
			flushDescription();
			if (result.at(-1) !== "") {
				result.push("");
			}
		} else {
			description.push(line.trim());
		}
	}

	flushDescription();

	while (result.at(-1) === "") {
		result.pop();
	}

	return result;
}

/**
 * Format a JSDoc block comment.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The JSDoc comment token.
 * @param  {object}  options
 *     Formatting options.
 * @returns  {string}
 *     The formatted comment text.
 */
export function formatJSDocComment(sourceCode, comment, options = {}) {
	const commentText = getCommentText(sourceCode, comment);
	const indent = getLineIndent(sourceCode, comment.range[0]) ?? "";
	const newline = getNewline(sourceCode.text);
	const width = Math.max(1, 80 - indent.length - 3);
	const content = getJSDocContent(commentText);
	const { proseLines, tagLines } = splitJSDocContent(content);
	const normaliseTagSeparator = options.normaliseTagSeparator !== false;
	const hasTagSeparator = proseLines.at(-1)?.trim() === "";
	const prose = formatProse(
		proseLines,
		width,
		options.addPunctuation === true,
		options.wrap !== false,
	);
	const tags = formatTags(
		tagLines,
		Math.max(1, width - 4),
		options.addPunctuation === true,
		options.normaliseTags === true,
	);
	const outputLines = [...prose];

	if (tags.length > 0) {
		if (
			outputLines.length > 0 &&
			outputLines.at(-1) !== "" &&
			(normaliseTagSeparator || hasTagSeparator)
		) {
			outputLines.push("");
		}

		outputLines.push(...tags);
	}

	return [
		`${indent}/**`,
		...outputLines.map((line) => (line === "" ? `${indent} *` : `${indent} * ${line}`)),
		`${indent} */`,
	].join(newline);
}

/**
 * Return whether a JSDoc comment contains a target tag.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The comment token.
 * @returns  {boolean}
 *     Whether a Phase 1 tag is present.
 */
export function hasTargetJSDocTag(sourceCode, comment) {
	return getJSDocContent(getCommentText(sourceCode, comment)).some(isTargetTag);
}
