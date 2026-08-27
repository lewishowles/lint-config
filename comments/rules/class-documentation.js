import { getDocumentationNode, reportFunctionDocumentation } from "../utils/documentation.js";
import { hasImmediateBlockComment, hasImmediateLineComment } from "../utils/source.js";

/**
 * Create the class-documentation rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Require block comments before classes." },
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
						message: "Classes require an immediately preceding block comment.",
						node: documentationNode,
					});
				}
			},
			/**
			 * Check class methods for required JSDoc blocks and tags. Constructors are
			 * exempt from the @returns requirement.
			 *
			 * @param  {object}  node
			 *     The method-definition node.
			 */
			MethodDefinition(node) {
				if (node.kind === "constructor") {
					reportFunctionDocumentation(context, node, node.value, {
						requiresReturns: false,
						subject: "Constructors",
					});

					return;
				}

				if (node.kind === "get") {
					reportFunctionDocumentation(context, node, node.value, {
						subject: "Getters",
					});

					return;
				}

				if (node.kind === "set") {
					reportFunctionDocumentation(context, node, node.value, {
						subject: "Setters",
					});

					return;
				}

				if (node.kind === "method") {
					reportFunctionDocumentation(context, node, node.value, {
						subject: "Methods",
					});
				}
			},
			/**
			 * Check instance fields for a preceding line comment.
			 *
			 * @param  {object}  node
			 *     The property-definition node.
			 */
			PropertyDefinition(node) {
				// Static fields are not covered by the instance-field requirement.
				if (node.static) {
					return;
				}

				if (!hasImmediateLineComment(context.sourceCode, node)) {
					context.report({
						message: "Instance fields require an immediately preceding line comment.",
						node,
					});
				}
			},
			/**
			 * Check a const class expression for a preceding block comment.
			 *
			 * @param  {object}  node
			 *     The variable declarator node.
			 */
			VariableDeclarator(node) {
				if (
					node.parent?.kind !== "const" ||
					node.parent.declarations.length !== 1 ||
					node.id?.type !== "Identifier" ||
					node.init?.type !== "ClassExpression"
				) {
					return;
				}

				// Resolves any export wrapper before checking for documentation.
				const documentationNode = getDocumentationNode(node.parent);

				if (!hasImmediateBlockComment(context.sourceCode, documentationNode)) {
					context.report({
						message: "Classes require an immediately preceding block comment.",
						node: documentationNode,
					});
				}
			},
		};
	},
};
