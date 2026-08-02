import {
	getObjectArgument,
	getObjectProperties,
	getPropertyName,
	isNamedCall,
} from "../utils/vue-macro.js";
import { getCommentNeighbours, isDirectiveComment, isLeadingComment } from "../utils/source.js";

// Matches the single newline and indentation allowed between a comment and a
// prop.
const immediateCommentGapPattern = /^\r?\n[ \t]*$/;

// The message shared by runtime props and their withDefaults entries.
const missingCommentMessage =
	"Vue prop declarations require an immediately preceding block comment.";

/**
 * Return the runtime props object from a defineProps call or withDefaults
 * wrapper.
 *
 * @param  {object}  callNode
 *     The call to inspect.
 *
 * @returns  {object|null}
 *     The runtime props object, or null for type-only and unrelated calls.
 */
function getPropsObject(callNode) {
	if (isNamedCall(callNode, "defineProps")) {
		return getObjectArgument(callNode, 0);
	}

	if (!isNamedCall(callNode, "withDefaults")) {
		return null;
	}

	// withDefaults' first argument, expected to be the defineProps call.
	const definePropsCall = callNode.arguments[0];

	return isNamedCall(definePropsCall, "defineProps") ? getObjectArgument(definePropsCall, 0) : null;
}

/**
 * Return the defaults object from a withDefaults call.
 *
 * @param  {object}  callNode
 *     The call to inspect.
 *
 * @returns  {object|null}
 *     The defaults object, when the call has one.
 */
function getDefaultsObject(callNode) {
	return isNamedCall(callNode, "withDefaults") ? getObjectArgument(callNode, 1) : null;
}

/**
 * Return whether a defineProps call is already handled by its withDefaults
 * wrapper.
 *
 * @param  {object}  node
 *     The defineProps call to inspect.
 *
 * @returns  {boolean}
 *     Whether the call is the first argument of withDefaults.
 */
function isWrappedDefinePropsCall(node) {
	// The node's enclosing call, when present.
	const parent = node.parent;

	return isNamedCall(parent, "withDefaults") && parent.arguments[0] === node;
}

/**
 * Return whether a property has an immediately preceding block comment.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  property
 *     The property to inspect.
 *
 * @returns  {boolean}
 *     Whether the property has the required documentation comment.
 */
function hasBlockComment(sourceCode, property) {
	// Finds the closest preceding comment.
	const comment = sourceCode
		.getAllComments()
		.findLast((candidate) => candidate.range[1] <= property.range[0]);

	if (comment?.type !== "Block" || isDirectiveComment(comment)) {
		return false;
	}

	// Checks the comments immediately around the property.
	const { next, previous } = getCommentNeighbours(sourceCode, comment);
	// The source text between the comment and the property.
	const gap = sourceCode.text.slice(comment.range[1], property.range[0]);

	return (
		next?.range[0] === property.range[0] &&
		isLeadingComment(sourceCode, comment, previous) &&
		immediateCommentGapPattern.test(gap)
	);
}

/**
 * Return the names of documented properties in an object expression.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  objectExpression
 *     The object expression to inspect.
 *
 * @returns  {Set<string>}
 *     The documented property names.
 */
function getDocumentedPropertyNames(sourceCode, objectExpression) {
	// Accumulates property names with a qualifying comment.
	const documentedPropertyNames = new Set();

	for (const property of getObjectProperties(objectExpression)) {
		// The property's name, when it can be determined.
		const propertyName = getPropertyName(property);

		if (propertyName !== null && hasBlockComment(sourceCode, property)) {
			documentedPropertyNames.add(propertyName);
		}
	}

	return documentedPropertyNames;
}

/**
 * Report properties without their required block comments.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 * @param  {object}  objectExpression
 *     The object expression whose properties should be checked.
 * @param  {Set<string>|undefined}  exemptedPropertyNames
 *     Property names documented by a matching defineProps entry.
 */
function reportUndocumentedProperties(context, objectExpression, exemptedPropertyNames) {
	for (const property of getObjectProperties(objectExpression)) {
		// The property's name, when it can be determined.
		const propertyName = getPropertyName(property);

		if (propertyName !== null && exemptedPropertyNames?.has(propertyName)) {
			continue;
		}

		if (!hasBlockComment(context.sourceCode, property)) {
			context.report({ message: missingCommentMessage, node: property });
		}
	}
}

/**
 * Check runtime props and withDefaults entries for documentation.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 * @param  {object}  node
 *     The call expression to inspect.
 */
function reportCallDocumentation(context, node) {
	// The call's runtime props object, when present.
	const propsObject = getPropsObject(node);

	if (!propsObject) {
		return;
	}

	// Every runtime defineProps property owns a required comment.
	reportUndocumentedProperties(context, propsObject);

	// The call's withDefaults defaults object, when present.
	const defaultsObject = getDefaultsObject(node);

	if (!defaultsObject) {
		return;
	}

	// A matching defineProps comment documents the corresponding default too.
	const documentedPropertyNames = getDocumentedPropertyNames(context.sourceCode, propsObject);

	reportUndocumentedProperties(context, defaultsObject, documentedPropertyNames);
}

export default {
	meta: {
		docs: { description: "Require block comments for Vue runtime props." },
		type: "suggestion",
	},
	/**
	 * Create the rule's node visitors.
	 *
	 * @param  {object}  context
	 *     The Oxlint rule context.
	 *
	 * @returns  {object}
	 *     The call-expression visitor for this rule.
	 */
	createOnce(context) {
		return {
			/**
			 * Check defineProps calls and their withDefaults wrapper.
			 *
			 * @param  {object}  node
			 *     The call expression to inspect.
			 */
			CallExpression(node) {
				if (!isNamedCall(node, "defineProps") && !isNamedCall(node, "withDefaults")) {
					return;
				}

				if (isNamedCall(node, "defineProps") && isWrappedDefinePropsCall(node)) {
					return;
				}

				reportCallDocumentation(context, node);
			},
		};
	},
};
