import { getDisplayWidth } from "./source.js";

// One word of comment text. A backtick code span counts as part of the word
// around it, so wrapping never splits the code inside it across lines.
const wordPattern = /(?:`[^`]*`|[^\s`]+|`)+/g;
// Text that is only an inline code span, which reads as code, not a sentence.
const codeSpanOnlyPattern = /^`[^`]*`$/;
// An inline code span anywhere in the text.
const codeSpanPattern = /`[^`]*`/;
// Text that is only a quotation, in straight or curly quotes.
const quoteOnlyPattern = /^(?:"[^"]*"|'[^']*'|“[^”]*”|‘[^’]*’)$/;

/**
 * Wrap words to a maximum line width.
 *
 * A code span is never split: one wider than the line goes whole on its own
 * line. Any other word wider than the line also gets its own line, and is cut
 * at the width only when nothing comes before it on the line.
 *
 * @param  {string}  text
 *     The text to wrap.
 * @param  {number}  width
 *     The maximum output width.
 *
 * @returns  {string[]}
 *     Wrapped lines.
 */
export function wrapWords(text, width) {
	// The text's words, with code spans kept whole.
	const words = text.trim().match(wordPattern) ?? [];
	// The wrapped lines, built up in place.
	const lines = [];

	// The line currently being filled.
	let currentLine = "";

	for (const word of words) {
		if (word.length > width && currentLine === "") {
			// Code stays whole even when it overflows the line.
			if (codeSpanPattern.test(word)) {
				lines.push(word);

				continue;
			}

			for (let index = 0; index < word.length; index += width) {
				lines.push(word.slice(index, index + width));
			}

			continue;
		}

		if (currentLine === "") {
			currentLine = word;
		} else if (currentLine.length + word.length + 1 <= width) {
			currentLine += ` ${word}`;
		} else {
			lines.push(currentLine);

			currentLine = word;
		}
	}

	if (currentLine !== "") {
		lines.push(currentLine);
	}

	return lines;
}

/**
 * Refill comment lines when the next line starts early enough to fit.
 *
 * @param  {object[]}  lines
 *     The comment lines, each with a display prefix and undecorated text.
 * @param  {number}  maximumLineLength
 *     The maximum display width for a complete comment line.
 *
 * @returns  {object[]}
 *     The refilled comment lines.
 */
export function refillCommentLines(lines, maximumLineLength) {
	// The lines copied so refilling does not change the caller's values.
	const result = lines.map(({ prefix, text }) => ({ prefix, text: text.trimEnd() }));

	for (let index = 0; index < result.length - 1; index += 1) {
		// The current line being considered for refilling.
		const currentLine = result[index];

		while (index < result.length - 1) {
			// The following line being considered for refilling.
			const nextLine = result[index + 1];

			if (!canRefillLine(currentLine.text) || !canProvideWords(nextLine.text)) {
				break;
			}

			// The next line's words, with code spans kept whole.
			const nextWords = nextLine.text.match(wordPattern) ?? [];

			// Whether the following line was removed after giving up all its
			// words.
			let removedNextLine = false;

			while (nextWords.length > 0) {
				// The first word that could move onto the current line.
				const nextWord = nextWords[0];
				// The candidate line after moving the next word.
				const candidate = `${currentLine.prefix}${currentLine.text} ${nextWord}`;

				if (getDisplayWidth(candidate) > maximumLineLength) {
					break;
				}

				currentLine.text = `${currentLine.text} ${nextWord}`;

				nextWords.shift();

				nextLine.text = nextWords.join(" ");

				if (nextLine.text === "") {
					result.splice(index + 1, 1);

					removedNextLine = true;

					break;
				}

				if (!canRefillLine(currentLine.text)) {
					break;
				}
			}

			if (!removedNextLine) {
				break;
			}
		}
	}

	return result;
}

/**
 * Return whether a line may receive words from the next line.
 *
 * @param  {string}  text
 *     The undecorated comment text.
 *
 * @returns  {boolean}
 *     Whether the line can be refilled.
 */
function canRefillLine(text) {
	// The line's text without its surrounding whitespace.
	const trimmedText = text.trim();

	return trimmedText !== "" && !/[.!?]$/.test(trimmedText) && !isListItem(trimmedText);
}

/**
 * Return whether a line may provide words to the line above it.
 *
 * @param  {string}  text
 *     The undecorated comment text.
 *
 * @returns  {boolean}
 *     Whether the line can provide its first word.
 */
function canProvideWords(text) {
	// The line's text without its surrounding whitespace.
	const trimmedText = text.trim();

	return trimmedText !== "" && !isListItem(trimmedText);
}

/**
 * Return whether text starts with a list-item marker.
 *
 * @param  {string}  text
 *     The undecorated comment text.
 *
 * @returns  {boolean}
 *     Whether the text is a list item.
 */
function isListItem(text) {
	return /^(?:[-*]\s+|\d+\.\s+)/.test(text.trim());
}

/**
 * Capitalise a sentence and ensure it has terminal punctuation.
 *
 * @param  {string}  text
 *     The sentence text.
 *
 * @returns  {string}
 *     The corrected sentence text.
 */
export function formatSentence(text) {
	return addTerminalPunctuation(capitaliseSentence(text));
}

/**
 * Capitalise the first letter of sentence text.
 *
 * Text that starts with anything other than a letter, such as a code span, a
 * quote or an emoji, is returned unchanged.
 *
 * @param  {string}  text
 *     The sentence text.
 *
 * @returns  {string}
 *     The capitalised sentence text.
 */
export function capitaliseSentence(text) {
	// The sentence text, without leading or trailing whitespace.
	const trimmedText = text.trim();

	if (trimmedText === "" || trimmedText.startsWith("@")) {
		return text;
	}

	// Code, quoted text and emoji keep their own casing, so only a sentence
	// that starts with a letter is capitalised.
	if (!/^\p{L}/u.test(trimmedText)) {
		return text;
	}

	// The leading word, before any space or punctuation.
	const leadingWord = trimmedText.match(/^\p{L}[\p{L}\p{N}]*/u)?.[0] ?? "";

	// A camelCase word (lowercase start, later uppercase) is a code identifier
	// and must keep its own casing rather than sentence casing.
	if (/^\p{Ll}[\p{Ll}\p{N}]*\p{Lu}/u.test(leadingWord)) {
		return text;
	}

	// The first letter character.
	const letter = trimmedText[0];
	// The text with its first letter capitalised.
	const formattedText = `${letter.toLocaleUpperCase()}${trimmedText.slice(1)}`;

	return text.replace(trimmedText, formattedText);
}

/**
 * Add a full stop to sentence text that has no closing punctuation.
 *
 * Text ending in a colon introduces what follows, and text that is only a code
 * span or a quotation is not a sentence, so both are returned unchanged. A
 * sentence that ends in a code span or quotation gets its full stop after the
 * closing mark.
 *
 * @param  {string}  text
 *     The sentence text.
 *
 * @returns  {string}
 *     The punctuated sentence text.
 */
export function addTerminalPunctuation(text) {
	// The sentence text, without leading or trailing whitespace.
	const trimmedText = text.trim();

	if (
		trimmedText === "" ||
		trimmedText.startsWith("@") ||
		/[.!?:]$/.test(trimmedText) ||
		codeSpanOnlyPattern.test(trimmedText) ||
		quoteOnlyPattern.test(trimmedText)
	) {
		return text;
	}

	return text.replace(trimmedText, `${trimmedText}.`);
}
