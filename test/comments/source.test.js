import assert from "node:assert/strict";
import test from "node:test";
import {
	getMinimalCommentReplacement,
	replaceMinimalComment,
} from "../../comments/utils/source.js";

test("Keeps separate JSDoc fixes in separate source ranges", () => {
	// The original, unformatted JSDoc comment.
	const commentText = `/**
 * Open the dialog.
 * @param {object} options
 */`;

	// The comment token under test.
	const comment = { range: [100, 100 + commentText.length] };

	// The comment with its block structure normalised.
	const blockFormattedComment = `/**
 * Open the dialog.
 *
 * @param {object} options
 */`;

	// The comment with its tag spacing normalised.
	const tagFormattedComment = `/**
 * Open the dialog.
 * @param  {object}  options
 */`;

	// The replacement produced by the block-structure formatter.
	const blockReplacement = getMinimalCommentReplacement(
		comment,
		commentText,
		blockFormattedComment,
	);

	// The replacement produced by the tag-formatting formatter.
	const tagReplacement = getMinimalCommentReplacement(comment, commentText, tagFormattedComment);

	assert.equal(
		commentText.slice(0, blockReplacement.range[0] - comment.range[0]) +
			blockReplacement.text +
			commentText.slice(blockReplacement.range[1] - comment.range[0]),
		blockFormattedComment,
	);
	assert.equal(
		commentText.slice(0, tagReplacement.range[0] - comment.range[0]) +
			tagReplacement.text +
			commentText.slice(tagReplacement.range[1] - comment.range[0]),
		tagFormattedComment,
	);
	assert.ok(blockReplacement.range[1] <= tagReplacement.range[0]);
});

test("Replaces only the changed comment range", () => {
	// The original line comment.
	const sourceText = "// Explain the dialog";
	// The comment token under test.
	const comment = { range: [100, 100 + sourceText.length] };

	// A minimal fixer stub that echoes back the requested replacement.
	const fixer = {
		/**
		 * Record the requested range and replacement text.
		 *
		 * @param  {number[]}  range
		 *     The source range to replace.
		 * @param  {string}  text
		 *     The replacement text.
		 *
		 * @returns  {object}
		 *     The recorded range and text.
		 */
		replaceTextRange(range, text) {
			return { range, text };
		},
	};

	assert.deepEqual(replaceMinimalComment(fixer, comment, sourceText, "// Explain the dialog."), {
		range: [sourceText.length + 100, sourceText.length + 100],
		text: ".",
	});
});

test("Deletes only the removed middle text", () => {
	// The original comment text.
	const sourceText = "// Keep removed text ending";
	// The formatted comment text, with its middle words removed.
	const formattedText = "// Keep ending";
	// The comment token under test.
	const comment = { range: [100, 100 + sourceText.length] };

	assert.deepEqual(getMinimalCommentReplacement(comment, sourceText, formattedText), {
		range: [108, 121],
		text: "",
	});
});

test("Replaces only changed middle text", () => {
	// The original comment text.
	const sourceText = "// Open modal";
	// The formatted comment text, with its middle word changed.
	const formattedText = "// Close modal";
	// The comment token under test.
	const comment = { range: [100, 100 + sourceText.length] };

	assert.deepEqual(getMinimalCommentReplacement(comment, sourceText, formattedText), {
		range: [103, 107],
		text: "Close",
	});
});

test("Rewrites text without shared boundaries", () => {
	// The original comment text.
	const sourceText = "First";
	// The formatted comment text, sharing no characters with the original.
	const formattedText = "Second";
	// The comment token under test.
	const comment = { range: [100, 100 + sourceText.length] };

	assert.deepEqual(getMinimalCommentReplacement(comment, sourceText, formattedText), {
		range: [100, 105],
		text: "Second",
	});
});
