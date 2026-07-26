import assert from "node:assert/strict";
import test from "node:test";
import {
	getMinimalCommentReplacement,
	replaceMinimalComment,
} from "../../comments/utils/source.js";

test("Keeps separate JSDoc fixes in separate source ranges", () => {
	const commentText = `/**
 * Open the dialog.
 * @param {object} options
 */`;

	const comment = { range: [100, 100 + commentText.length] };

	const blockFormattedComment = `/**
 * Open the dialog.
 *
 * @param {object} options
 */`;

	const tagFormattedComment = `/**
 * Open the dialog.
 * @param  {object}  options
 */`;

	const blockReplacement = getMinimalCommentReplacement(
		comment,
		commentText,
		blockFormattedComment,
	);

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
	const sourceText = "// Explain the dialog";
	const comment = { range: [100, 100 + sourceText.length] };

	const fixer = {
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
	const sourceText = "// Keep removed text ending";
	const formattedText = "// Keep ending";
	const comment = { range: [100, 100 + sourceText.length] };

	assert.deepEqual(getMinimalCommentReplacement(comment, sourceText, formattedText), {
		range: [108, 121],
		text: "",
	});
});

test("Replaces only changed middle text", () => {
	const sourceText = "// Open modal";
	const formattedText = "// Close modal";
	const comment = { range: [100, 100 + sourceText.length] };

	assert.deepEqual(getMinimalCommentReplacement(comment, sourceText, formattedText), {
		range: [103, 107],
		text: "Close",
	});
});

test("Rewrites text without shared boundaries", () => {
	const sourceText = "First";
	const formattedText = "Second";
	const comment = { range: [100, 100 + sourceText.length] };

	assert.deepEqual(getMinimalCommentReplacement(comment, sourceText, formattedText), {
		range: [100, 105],
		text: "Second",
	});
});
