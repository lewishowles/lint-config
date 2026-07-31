import { existsSync, readFileSync } from "node:fs";
import { isDirectiveComment } from "../utils/source.js";

// Keep raw script blocks in source order so each one matches its component
// entry point.
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
		// The Vue file path is unavailable until the first script block is processed.
		// Read the file only then.
		let scriptBlocks;
		// Advance once for each script block, so source-order matching remains stable.
		let scriptBlockIndex = 0;

		return {
			/**
			 * Check the current component's script setup block for documentation.
			 *
			 * @param  {object}  node
			 *     The entry point parsed from the current script block.
			 */
			Program(node) {
				scriptBlocks ??= getScriptBlocks(context);

				// Keep this visitor aligned with its source-order script block.
				const scriptBlock = scriptBlocks[scriptBlockIndex];

				scriptBlockIndex += 1;

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
