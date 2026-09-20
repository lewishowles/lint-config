import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("comment formatting settles comment-formatting collisions in one pass", () => {
	const repositoryDirectory = process.cwd();
	const fixtureDirectory = join(repositoryDirectory, "test/comments/oxlint-integration");
	const temporaryDirectory = mkdtempSync(join(tmpdir(), "lint-config-one-pass-convergence-"));

	const fixtureNames = readdirSync(fixtureDirectory).filter(
		(name) =>
			name.endsWith("-wrap-punctuation-collision.js.txt") ||
			name === "fixer-range-collision.js.txt" ||
			name === "placement-formatting-convergence.js.txt",
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

		for (const fixtureName of fixtureNames) {
			const fixedSource = readFileSync(
				join(temporaryDirectory, fixtureName.slice(0, -".txt".length)),
				"utf8",
			);

			// The source phrase that proves the fixer kept each fixture's
			// comment text.
			const expectedText =
				fixtureName === "fixer-range-collision.js.txt"
					? /Open the dialog\./
					: /original\s+(?:\*\s+)?trigger\./;

			assert.match(fixedSource, expectedText, `${fixtureName} lost its comment text.`);
		}
	} finally {
		rmSync(temporaryDirectory, { force: true, recursive: true });
	}
});
