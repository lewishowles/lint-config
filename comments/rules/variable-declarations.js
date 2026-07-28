import { getCommentNeighbours, isDirectiveComment, isLeadingComment } from "../utils/source.js";

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
 * Return whether a line comment immediately documents a declaration.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The variable declaration node.
 *
 * @returns  {boolean}
 *     Whether an ordinary line comment immediately precedes the declaration.
 */
function hasDeclarationComment(sourceCode, node) {
	// Finds the closest preceding comment.
	const comment = sourceCode
		.getAllComments()
		.findLast((candidate) => candidate.range[1] <= node.range[0]);

	if (comment?.type !== "Line" || isDirectiveComment(comment)) {
		return false;
	}

	// Checks the comments immediately around the declaration.
	const { next, previous } = getCommentNeighbours(sourceCode, comment);

	// Confirms there is no blank line before the declaration.
	const gap = sourceCode.text.slice(comment.range[1], node.range[0]);

	return (
		next?.range[0] === node.range[0] &&
		isLeadingComment(sourceCode, comment, previous) &&
		/^\r?\n[ \t]*$/.test(gap)
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
	},
	createOnce(context) {
		return {
			VariableDeclaration(node) {
				if ((node.kind !== "const" && node.kind !== "let") || isLoopHeaderDeclaration(node)) {
					return;
				}

				if (!hasDeclarationComment(context.sourceCode, node)) {
					context.report({
						message: "Variable declarations require an immediately preceding line comment.",
						node,
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
