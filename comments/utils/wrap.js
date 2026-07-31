/**
 * Wrap words to a maximum line width.
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
	// The text's individual words.
	const words = text.trim().split(/\s+/).filter(Boolean);
	// The wrapped lines, built up in place.
	const lines = [];

	// The line currently being filled.
	let currentLine = "";

	for (const word of words) {
		if (word.length > width && currentLine === "") {
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

	// The index of the first letter character, ignoring leading punctuation.
	const firstLetter = trimmedText.search(/\p{L}/u);

	if (firstLetter < 0) {
		return text;
	}

	// The leading word, starting from the first letter character.
	const leadingWord = trimmedText.slice(firstLetter).match(/^\p{L}[\p{L}\p{N}]*/u)?.[0] ?? "";

	// A camelCase word (lowercase start, later uppercase) is a code
	// identifier and must keep its own casing rather than sentence casing.
	if (/^\p{Ll}[\p{Ll}\p{N}]*\p{Lu}/u.test(leadingWord)) {
		return text;
	}

	// The first letter character.
	const letter = trimmedText[firstLetter];
	// The text with its first letter capitalised.
	const formattedText = `${trimmedText.slice(0, firstLetter)}${letter.toLocaleUpperCase()}${trimmedText.slice(firstLetter + 1)}`;

	return text.replace(trimmedText, formattedText);
}

/**
 * Add terminal punctuation to sentence text.
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

	if (trimmedText === "" || trimmedText.startsWith("@") || /[.!?]$/.test(trimmedText)) {
		return text;
	}

	return text.replace(trimmedText, `${trimmedText}.`);
}
