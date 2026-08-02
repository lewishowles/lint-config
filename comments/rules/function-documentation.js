import { isFunctionValue, reportFunctionDocumentation } from "../utils/documentation.js";

/**
 * Return the declaration node that owns the documentation position.
 *
 * @param  {object}  node
 *     The function declaration node.
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
 * Return whether an object property belongs to the outermost object literal.
 *
 * @param  {object}  node
 *     The property node to inspect.
 *
 * @returns  {boolean}
 *     Whether the property is not nested inside another object literal.
 */
function isFirstLevelObjectProperty(node) {
	// Finds the object literal that owns the property.
	const object = node.parent;

	if (object?.type !== "ObjectExpression") {
		return false;
	}

	return object.parent?.parent?.type !== "ObjectExpression";
}

/**
 * Create the function-documentation rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Require JSDoc documentation for named functions and methods." },
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
			 * Check a named function declaration for documentation.
			 *
			 * @param  {object}  node
			 *     The function declaration node.
			 */
			FunctionDeclaration(node) {
				if (node.id) {
					reportFunctionDocumentation(context, getDocumentationNode(node), node);
				}
			},
			/**
			 * Check a first-level object method for documentation.
			 *
			 * @param  {object}  node
			 *     The property node.
			 */
			Property(node) {
				if (!isFirstLevelObjectProperty(node) || !isFunctionValue(node.value)) {
					return;
				}

				reportFunctionDocumentation(context, node, node.value);
			},
			/**
			 * Check a const function variable for documentation.
			 *
			 * @param  {object}  node
			 *     The variable declarator node.
			 */
			VariableDeclarator(node) {
				if (
					node.id.type !== "Identifier" ||
					node.parent?.kind !== "const" ||
					!isFunctionValue(node.init)
				) {
					return;
				}

				reportFunctionDocumentation(context, node.parent, node.init);
			},
		};
	},
};
