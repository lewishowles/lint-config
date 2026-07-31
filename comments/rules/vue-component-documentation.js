import { existsSync, readFileSync } from "node:fs";
import { isDirectiveComment } from "../utils/source.js";

// Captures the opening tag's attributes separately, so the setup attribute
// can be tested without the tag being available from Oxlint's extracted AST.
const scriptBlockPattern =
	/(?<openingTag><script\b(?<attributes>[^>]*)>)(?<content>[\s\S]*?)<\/script\s*>/gi;

// Only a standalone setup attribute qualifies, avoiding matches such as
// data-setup or setup-mode.
const setupAttributePattern = /(?:^|\s)setup(?:\s|=|$)/i;
// Match only indentation and one line break, so documentation sits directly
// after the script tag.
const immediateCommentGapPattern = /^[ \t]*(?:\r?\n[ \t]*)?$/;

/**
 * Read raw Vue source because extracted script text cannot identify script
 * setup.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 *
 * @returns  {string|null}
 *     The Vue source, when the physical filename can be read.
 */
function getVueSource(context) {
	try {
		// The extracted script text does not include the component markup.
		// Read the opening tag from the Vue file instead.
		const physicalFilename = context.physicalFilename;

		if (typeof physicalFilename !== "string" || !physicalFilename.endsWith(".vue")) {
			return null;
		}

		if (!existsSync(physicalFilename)) {
			return null;
		}

		return readFileSync(physicalFilename, "utf8");
	} catch {
		return null;
	}
}

/**
 * Get raw Vue script blocks in source order.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 *
 * @returns  {RegExpMatchArray[]}
 *     The Vue script blocks, or an empty array when the source is unavailable.
 */
function getScriptBlocks(context) {
	// Component markup is only available from the physical Vue file.
	const vueSource = getVueSource(context);

	return vueSource ? Array.from(vueSource.matchAll(scriptBlockPattern)) : [];
}

/**
 * Find the raw script block matching the current Program's extracted text.
 *
 * @param  {object}  context
 *     The rule context for the extracted script block.
 *
 * @returns  {RegExpMatchArray|undefined}
 *     The matching raw script block, when one is found.
 */
function findScriptBlock(context) {
	// Re-read on every call rather than caching, since this file's other
	// script blocks may not have been visited yet or ever in this run.
	const scriptBlocks = getScriptBlocks(context);

	return scriptBlocks.find(
		(scriptBlock) => scriptBlock.groups.content.trim() === context.sourceCode.text.trim(),
	);
}

/**
 * Check whether a script block uses Vue's setup attribute.
 *
 * @param  {RegExpMatchArray}  scriptBlock
 *     The raw Vue script block.
 *
 * @returns  {boolean}
 *     Whether the script block is a script setup block.
 */
function isScriptSetupBlock(scriptBlock) {
	// Inspect only the opening tag, so setup code cannot affect the block type.
	const scriptAttributes = scriptBlock.groups?.attributes ?? "";

	return setupAttributePattern.test(scriptAttributes);
}

/**
 * Check whether a Vue script setup block starts with a documentation comment.
 *
 * @param  {object}  context
 *     The rule context for the extracted script block.
 * @param  {RegExpMatchArray|undefined}  scriptBlock
 *     The script block matched to the current component's entry point.
 *
 * @returns  {boolean}
 *     Whether the component has the required documentation comment.
 */
function hasComponentDocumentation(context, scriptBlock) {
	if (!scriptBlock || !isScriptSetupBlock(scriptBlock)) {
		return true;
	}

	// This Program visitor runs once per script block, so sourceCode is scoped
	// to the current block and [0] cannot pick up a comment from another one.
	const comment = context.sourceCode.getAllComments()[0];

	// Lint directives alter rule execution but cannot document a component.
	if (comment?.type !== "Block" || isDirectiveComment(comment)) {
		return false;
	}

	// A blank line would separate the component documentation from its entry point.
	const commentGap = context.sourceCode.text.slice(0, comment.range[0]);

	return immediateCommentGapPattern.test(commentGap);
}

export default {
	meta: {
		docs: { description: "Require documentation for Vue script setup components." },
		type: "suggestion",
	},
	/**
	 * Create the checks that inspect each script block.
	 *
	 * @param  {object}  context
	 *     The Oxlint rule context.
	 *
	 * @returns  {object}
	 *     The script-block checks for this rule.
	 */
	createOnce(context) {
		return {
			/**
			 * Check the current component's script setup block for documentation.
			 *
			 * @param  {object}  node
			 *     The entry point parsed from the current script block.
			 */
			Program(node) {
				// createOnce builds this visitor once for the whole run, and a
				// single file's script blocks are not necessarily visited
				// consecutively, so the matching block is looked up fresh on each
				// call rather than tracked with shared state.
				const scriptBlock = findScriptBlock(context);

				if (hasComponentDocumentation(context, scriptBlock)) {
					return;
				}

				context.report({
					message:
						"Vue script setup components require a documentation block after the opening tag.",
					node: node.body[0] ?? node,
				});
			},
		};
	},
};
