import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import assert from "node:assert/strict";
import test from "node:test";

test("comment formatting settles comment-formatting collisions in one pass", () => {
	const repositoryDirectory = process.cwd();
	const fixtureDirectory = join(repositoryDirectory, "test/comments/oxlint-integration");
	const temporaryDirectory = mkdtempSync(join(tmpdir(), "lint-config-one-pass-convergence-"));

	const fixtureNames = readdirSync(fixtureDirectory).filter(
		(name) =>
			name.endsWith("-wrap-punctuation-collision.js.txt") ||
			name === "fixer-range-collision.js.txt" ||
			name === "placement-formatting-convergence.js.txt" ||
			name === "indented-line-comment-convergence.js.txt" ||
			name === "line-comment-preserved-lines.js.txt" ||
			name === "jsdoc-markdown-tag-body.js.txt",
	);

	try {
		assert.ok(
			fixtureNames.length > 0,
			"Expected at least one comment-formatting collision fixture.",
		);

		for (const fixtureName of fixtureNames) {
			const source = readFileSync(join(fixtureDirectory, fixtureName), "utf8");
			const targetName = fixtureName.slice(0, -".txt".length);

			writeFileSync(join(temporaryDirectory, targetName), source);
		}

		writeFileSync(
			join(temporaryDirectory, "inline-hyphen-description.js"),
			`/**
 * Explain the name.
 *
 * @param {string} name - description stays on its own line
 */
function explainName(name) {}`,
		);

		execFileSync(
			"./node_modules/.bin/oxlint",
			[
				"--config",
				".oxlintrc.json",
				"--allow",
				"no-undef",
				"--allow",
				"no-unused-vars",
				"--fix",
				temporaryDirectory,
			],
			{ cwd: repositoryDirectory, encoding: "utf8", stdio: "pipe" },
		);

		const secondRun = execFileSync(
			"./node_modules/.bin/oxlint",
			[
				"--config",
				".oxlintrc.json",
				"--allow",
				"no-undef",
				"--allow",
				"no-unused-vars",
				temporaryDirectory,
			],
			{ cwd: repositoryDirectory, encoding: "utf8", stdio: "pipe" },
		);

		assert.equal(secondRun.trim(), "", `Second lint run reported diagnostics:\n${secondRun}`);

		// The hyphen-style @param fixture after one fix.
		const fixedHyphenDescription = readFileSync(
			join(temporaryDirectory, "inline-hyphen-description.js"),
			"utf8",
		);

		assert.match(
			fixedHyphenDescription,
			/\* @param {2}\{string\} {2}name\n \* {5}Description stays on its own line\./,
		);

		assert.doesNotMatch(fixedHyphenDescription, /\u2060/);

		// The comment text each fixture must still contain after fixing, where
		// it differs from the shared default phrase.
		const expectedTextByFixture = {
			"fixer-range-collision.js.txt": /Open the dialog\./,
			"jsdoc-markdown-tag-body.js.txt": /#### `required`/,
			"line-comment-preserved-lines.js.txt": /\/\/ endBudget = 7\n\/\/ start: one \(3\), two \(4\)/,
		};

		for (const fixtureName of fixtureNames) {
			const fixedSource = readFileSync(
				join(temporaryDirectory, fixtureName.slice(0, -".txt".length)),
				"utf8",
			);

			// The source phrase that proves the fixer kept each fixture's
			// comment text.
			const expectedText = expectedTextByFixture[fixtureName] ?? /original\s+(?:\*\s+)?trigger\./;

			assert.match(fixedSource, expectedText, `${fixtureName} lost its comment text.`);

			if (fixtureName === "indented-line-comment-convergence.js.txt") {
				assert.match(
					fixedSource,
					/\/\/ Explain the dialog when opening\n\/\/ the original trigger\./,
				);
			}

			if (fixtureName === "line-comment-preserved-lines.js.txt") {
				assert.match(
					fixedSource,
					/\/\/ Explain how the stored values are used\.\n\/\/ endBudget = 7/,
				);

				assert.match(
					fixedSource,
					/\/\/ This final line is deliberately long and wraps only its own words onto a\n\/\/ second line\./,
				);
			}

			if (fixtureName === "jsdoc-markdown-tag-body.js.txt") {
				assert.match(fixedSource, /2024\. /);
				assert.match(fixedSource, / - /);
				assert.match(fixedSource, /string \| number/);
				assert.doesNotMatch(fixedSource, /^ \* (?:2024\. |\| number)/m);
				assert.doesNotMatch(fixedSource, /^ \* - describes/m);

				// The Markdown lines that must survive the first fix unchanged.
				const structuralLines = [
					" * # Available rules",
					" * #### `required`",
					" * - `string`: A string, including an empty string",
					" * * `boolean`: Strictly true or false",
					" * 1. First item stays as written",
					" *   continuation stays as written",
					" * | Rule | Value |",
					" * | --- | --- |",
					" * | in | one |",
					" * ```js",
					" * const value = 1;",
					" *",
					" * console.log(value);",
					" * ```",
				];

				for (const line of structuralLines) {
					assert.ok(fixedSource.split("\n").includes(line), `${fixtureName} changed ${line}`);
				}
			}
		}
	} finally {
		rmSync(temporaryDirectory, { force: true, recursive: true });
	}
});
