import { getJSDocContent, isJSDoc } from "../utils/jsdoc.js";
import {
	getCommentNeighbours,
	getCommentText,
	isDirectiveComment,
	isLeadingComment,
} from "../utils/source.js";

/**
 * Return whether a node is a function expression or arrow function.
 *
 * @param  {object}  node
 *     The node to inspect.
 *
 * @returns  {boolean}
 *     Whether the node is a function value.
 */
function isFunctionValue(node) {
	return node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
}

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
 * Return the JSDoc block immediately before a documented node.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The node that documentation must precede.
 *
 * @returns  {object|null}
 *     The associated JSDoc token, when present.
 */
function getDocumentationComment(sourceCode, node) {
	// Finds the closest preceding comment.
	const comment = sourceCode
		.getAllComments()
		.findLast((candidate) => candidate.range[1] <= node.range[0]);

	if (comment?.type !== "Block" || isDirectiveComment(comment)) {
		return null;
	}

	// Checks the comments immediately around the documented node.
	const { next, previous } = getCommentNeighbours(sourceCode, comment);
	// Confirms there is no blank line before the documented node.
	const gap = sourceCode.text.slice(comment.range[1], node.range[0]);

	if (
		!next ||
		next.range[0] > node.range[0] ||
		next.range[1] > node.range[1] ||
		!isLeadingComment(sourceCode, comment, previous) ||
		!/^\r?\n[ \t]*$/.test(gap)
	) {
		return null;
	}

	return isJSDoc(getCommentText(sourceCode, comment)) ? comment : null;
}

/**
 * Return the property name used in a JSDoc parameter path.
 *
 * @param  {object}  node
 *     The property key node.
 *
 * @returns  {string|null}
 *     The external property name, when it can be documented.
 */
function getPropertyName(node) {
	if (node.type === "Identifier") {
		return node.name;
	}

	if (typeof node.value === "string" || typeof node.value === "number") {
		return String(node.value);
	}

	return null;
}

/**
 * Return the source representation of a default value.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The default-value node.
 *
 * @returns  {string}
 *     The source text for the default value.
 */
function getDefaultValue(sourceCode, node) {
	return sourceCode.text.slice(node.range[0], node.range[1]);
}

/**
 * Return JSDoc paths for the properties in an object pattern.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The object-pattern node.
 * @param  {string}  parentPath
 *     The path for the containing object.
 *
 * @returns  {string[]}
 *     The required JSDoc parameter paths.
 */
function getObjectPatternPaths(sourceCode, node, parentPath) {
	// Collects the parent path alongside each nested property path.
	const paths = [parentPath];

	for (const property of node.properties) {
		if (property.type !== "Property") {
			continue;
		}

		// Skips properties whose key cannot be represented in a JSDoc path.
		const propertyName = getPropertyName(property.key);

		if (propertyName === null) {
			continue;
		}

		// Builds the dotted path used to document this property.
		const propertyPath = `${parentPath}.${propertyName}`;
		// Inspects the property's value to decide how it should be documented.
		const value = property.value;

		if (value.type === "ObjectPattern") {
			paths.push(...getObjectPatternPaths(sourceCode, value, propertyPath));
			continue;
		}

		if (value.type === "AssignmentPattern") {
			paths.push(`[${propertyPath}=${getDefaultValue(sourceCode, value.right)}]`);
			continue;
		}

		paths.push(propertyPath);
	}

	return paths;
}

/**
 * Return JSDoc paths for one declared parameter.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The parameter node.
 *
 * @returns  {string[]}
 *     The required JSDoc parameter paths.
 */
function getParameterPaths(sourceCode, node) {
	if (node.type === "Identifier") {
		return [node.name];
	}

	if (node.type === "RestElement" && node.argument.type === "Identifier") {
		return [node.argument.name];
	}

	if (node.type === "ObjectPattern") {
		return getObjectPatternPaths(sourceCode, node, "options");
	}

	if (node.type === "AssignmentPattern") {
		return getParameterPaths(sourceCode, node.left);
	}

	return [];
}

/**
 * Return JSDoc parameter names from a documentation block.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  comment
 *     The JSDoc comment token.
 *
 * @returns  {Set<string>}
 *     The documented parameter names.
 */
function getDocumentedParameters(sourceCode, comment) {
	// Splits the JSDoc block into its individual lines.
	const content = getJSDocContent(getCommentText(sourceCode, comment));
	// Collects the parameter paths documented by @param tags.
	const names = new Set();

	for (const line of content) {
		// Matches an @param tag and captures its documented path.
		const match = line.trim().match(/^@param(?:\s+\{[^}]+\})?\s+(\[[^\]]+\]|\S+)/);

		if (match) {
			names.add(match[1]);
		}
	}

	return names;
}

/**
 * Return whether a function body contains a node type outside nested functions.
 *
 * @param  {object}  node
 *     The node to inspect.
 * @param  {string}  targetType
 *     The statement type to find.
 * @param  {Function}  matches
 *     Return whether a matching statement meets the requirement.
 *
 * @returns  {boolean}
 *     Whether the target statement appears in the body.
 */
function containsStatement(node, targetType, matches = () => true) {
	if (!node || typeof node !== "object") {
		return false;
	}

	if (node.type === targetType) {
		return matches(node);
	}

	if (isFunctionValue(node) || node.type === "FunctionDeclaration") {
		return false;
	}

	for (const [key, value] of Object.entries(node)) {
		if (key === "parent") {
			continue;
		}

		if (Array.isArray(value)) {
			if (value.some((item) => containsStatement(item, targetType, matches))) {
				return true;
			}
		} else if (containsStatement(value, targetType, matches)) {
			return true;
		}
	}

	return false;
}

/**
 * Return whether a function explicitly returns a value.
 *
 * @param  {object}  node
 *     The function node to inspect.
 *
 * @returns  {boolean}
 *     Whether the function returns a value.
 */
function hasValueReturn(node) {
	if (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement") {
		return true;
	}

	return containsStatement(
		node.body,
		"ReturnStatement",
		(statement) => statement.argument !== null,
	);
}

/**
 * Report missing documentation requirements for one function.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 * @param  {object}  node
 *     The documentation-position node.
 * @param  {object}  functionNode
 *     The function node to inspect.
 */
function reportFunctionDocumentation(context, node, functionNode) {
	// Finds the JSDoc block documenting this function, when present.
	const comment = getDocumentationComment(context.sourceCode, node);

	if (!comment) {
		context.report({
			message: "Functions require an immediately preceding JSDoc block.",
			node,
		});

		return;
	}

	// Reads the parameter paths already documented by @param tags.
	const documentedParameters = getDocumentedParameters(context.sourceCode, comment);

	// Derives the parameter paths the function actually requires.
	const parameterPaths = functionNode.params.flatMap((parameter) =>
		getParameterPaths(context.sourceCode, parameter),
	);

	for (const path of parameterPaths) {
		if (!documentedParameters.has(path)) {
			context.report({
				message: `Functions require an @param for ${path}.`,
				node,
			});
		}
	}

	// Splits the JSDoc block into its individual lines.
	const content = getJSDocContent(getCommentText(context.sourceCode, comment));
	// Checks whether the return value is documented.
	const hasReturns = content.some((line) => /^@returns\b/.test(line.trim()));
	// Checks whether thrown errors are documented.
	const hasThrows = content.some((line) => /^@throws\b/.test(line.trim()));

	if (hasValueReturn(functionNode) && !hasReturns) {
		context.report({
			message: "Functions that return a value require an @returns tag.",
			node,
		});
	}

	if (containsStatement(functionNode.body, "ThrowStatement") && !hasThrows) {
		context.report({
			message: "Functions that throw require an @throws tag.",
			node,
		});
	}
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
