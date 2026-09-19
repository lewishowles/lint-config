import { getDocumentationNode, isFunctionValue } from "../utils/documentation.js";
import { hasImmediateLineComment } from "../utils/source.js";

// Declaration kinds that require an immediately preceding line comment.
const documentedKinds = new Set(["await using", "const", "let", "using"]);

/**
 * Return whether a declaration is inside a loop header.
 *
 * @param  {object}  node
 *     The variable declaration node.
 *
 * @returns  {boolean}
 *     Whether the declaration is exempt from the rule.
 */
function isLoopHeaderDeclaration(node) {
	// Inspects the declaration's parent to identify loop headers.
	const parent = node.parent;

	return (
		(parent.type === "ForStatement" && parent.init === node) ||
		((parent.type === "ForInStatement" || parent.type === "ForOfStatement") && parent.left === node)
	);
}

/**
 * Create the variable-declaration comment rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Require comments before variable declarations." },
		type: "suggestion",
		schema: [
			{
				type: "object",
				properties: {
					rootOnly: {
						type: "boolean",
					},
				},
				additionalProperties: false,
			},
		],
		defaultOptions: [{ rootOnly: false }],
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
			 * Check a variable declaration for a preceding line comment.
			 *
			 * @param  {object}  node
			 *     The variable declaration node.
			 */
			VariableDeclaration(node) {
				if (!documentedKinds.has(node.kind) || isLoopHeaderDeclaration(node)) {
					return;
				}

				// A lone const class expression is documented by
				// class-documentation.
				if (
					node.kind === "const" &&
					node.declarations.length === 1 &&
					node.declarations[0].id?.type === "Identifier" &&
					node.declarations[0].init?.type === "ClassExpression"
				) {
					return;
				}

				// Whether every name in this const holds a function. The
				// function-documentation rule already requires a JSDoc
				// block on those, so asking for a line comment as well
				// would make the two rules impossible to satisfy together.
				const isFunctionValuedConst =
					node.kind === "const" &&
					node.declarations.every(
						({ id, init }) => id.type === "Identifier" && isFunctionValue(init),
					);

				// The rule's resolved options for the file currently being
				// visited.
				const options = context.options?.[0];
				// Resolves any export wrapper before checking for
				// documentation.
				const documentationNode = getDocumentationNode(node);

				// With rootOnly, only declarations directly under the
				// Program need a comment, so a nested variable inside
				// a function is left alone.
				const shouldCheckDocumentation =
					!options?.rootOnly || documentationNode.parent?.type === "Program";

				if (
					!isFunctionValuedConst &&
					shouldCheckDocumentation &&
					!hasImmediateLineComment(context.sourceCode, documentationNode)
				) {
					context.report({
						message: "Variable declarations require an immediately preceding line comment.",
						node: documentationNode,
					});
				}

				if (node.declarations.length > 1) {
					context.report({
						message: "Declare one variable per declaration statement.",
						node,
					});
				}
			},
		};
	},
};
