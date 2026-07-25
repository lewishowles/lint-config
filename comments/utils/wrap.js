/**
 * Wrap words to a maximum line width.
 *
 * @param  {string}  text
 *     The text to wrap.
 * @param  {number}  width
 *     The maximum output width.
 * @returns  {string[]}
 *     Wrapped lines.
 */
export function wrapWords(text, width) {
	const words = text.trim().split(/\s+/).filter(Boolean);
	const lines = [];
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
 * @returns  {string}
 *     The capitalised sentence text.
 */
export function capitaliseSentence(text) {
	const trimmedText = text.trim();

	if (trimmedText === "" || trimmedText.startsWith("@")) {
		return text;
	}

	const firstLetter = trimmedText.search(/\p{L}/u);
	let formattedText = trimmedText;

	if (firstLetter >= 0) {
		const letter = formattedText[firstLetter];
		formattedText = `${formattedText.slice(0, firstLetter)}${letter.toLocaleUpperCase()}${formattedText.slice(firstLetter + 1)}`;
	}

	return text.replace(trimmedText, formattedText);
}

/**
 * Add terminal punctuation to sentence text.
 *
 * @param  {string}  text
 *     The sentence text.
 * @returns  {string}
 *     The punctuated sentence text.
 */
export function addTerminalPunctuation(text) {
	const trimmedText = text.trim();

	if (trimmedText === "" || trimmedText.startsWith("@") || /[.!?]$/.test(trimmedText)) {
		return text;
	}

	return text.replace(trimmedText, `${trimmedText}.`);
}
