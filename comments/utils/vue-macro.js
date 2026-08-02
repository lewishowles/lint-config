/**
 * Return whether a node is a call expression invoking the given function name.
 *
 * @param  {object}  node
 *     The node to inspect.
 * @param  {string}  name
 *     The function name to match.
 *
 * @returns  {boolean}
 *     Whether the node matches.
 */
export function isNamedCall(node, name) {
	return (
		node?.type === "CallExpression" &&
		node.callee?.type === "Identifier" &&
		node.callee.name === name
	);
}

/**
 * Return an object argument from a call, when one is present.
 *
 * @param  {object}  callNode
 *     The call whose argument should be inspected.
 * @param  {number}  argumentIndex
 *     The argument position to inspect.
 *
 * @returns  {object|null}
 *     The object argument, or null when it is missing or not an object.
 */
export function getObjectArgument(callNode, argumentIndex) {
	// The candidate object argument for runtime declarations.
	const argument = callNode.arguments[argumentIndex];

	return argument?.type === "ObjectExpression" ? argument : null;
}

/**
 * Return the object properties that represent runtime declarations.
 *
 * @param  {object}  objectExpression
 *     The object expression to inspect.
 *
 * @returns  {object[]}
 *     Its ordinary properties, excluding spread elements.
 */
export function getObjectProperties(objectExpression) {
	return objectExpression.properties.filter((property) => property.type === "Property");
}

/**
 * Return the name of an object property.
 *
 * @param  {object}  property
 *     The property to inspect.
 *
 * @returns  {string|null}
 *     The property name, when it is a string or number.
 */
export function getPropertyName(property) {
	if (property.key.type === "Identifier") {
		return property.key.name;
	}

	if (typeof property.key.value === "string" || typeof property.key.value === "number") {
		return String(property.key.value);
	}

	return null;
}
