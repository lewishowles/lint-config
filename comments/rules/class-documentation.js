import { hasImmediateBlockComment } from "../utils/source.js";

/**
 * Return the declaration node that owns the documentation position.
 *
 * @param  {object}  node
 *     The class declaration node.
 *
 * @returns  {object}
 *     The node immediately following the documentation block.
 */
function getDocumentationNode(node) {
	// Walks up through export wrappers to find the documented position.
	let documentationNode = node;

	while (
		documentationNode.parent?.type === "ExportDefaultDeclaration" ||
		documentationNode.parent?.type === "ExportNamedDeclaration"
	) {
		documentationNode = documentationNode.parent;
	}

	return documentationNode;
}

/**
 * Create the class-documentation rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Require block comments before class declarations." },
		type: "suggestion",
	},
	/**
	 * Create the rule's node visitors.
	 *
	 * @param  {object}  context
	 *     The Oxlint rule context.
	 *
	 * @returns  {object}
	 *     The visitor functions for this rule.
	 */
	createOnce(context) {
		return {
			/**
			 * Check a class declaration for a preceding block comment.
			 *
			 * @param  {object}  node
			 *     The class declaration node.
			 */
			ClassDeclaration(node) {
				// Resolves any export wrapper before checking for documentation.
				const documentationNode = getDocumentationNode(node);

				if (!hasImmediateBlockComment(context.sourceCode, documentationNode)) {
					context.report({
						message: "Class declarations require an immediately preceding block comment.",
						node: documentationNode,
					});
				}
			},
		};
	},
};
