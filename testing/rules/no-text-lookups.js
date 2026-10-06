// The array methods that count as a lookup when their callback reads an
// element's text.
const searchMethods = new Set([
	"filter",
	"find",
	"findLast",
	"findIndex",
	"findLastIndex",
	"some",
	"every",
]);

// The DOM properties that hold an element's visible text.
const textProperties = new Set(["textContent", "innerText"]);

/**
 * Return whether a callback body reads an element's text anywhere inside it.
 *
 * @param  {object}  node
 *     The callback body, or a node inside it while searching.
 *
 * @returns  {boolean}
 *     Whether any part of the body calls text() or reads textContent or
 *     innerText.
 */
function containsTextRead(node) {
	// A nested search callback is reported at its own call, so it isn't
	// counted again here.
	if (isSearchCallback(node)) {
		return false;
	}

	if (isTextRead(node)) {
		return true;
	}

	for (const [key, child] of Object.entries(node)) {
		if (key === "parent") {
			continue;
		}

		if (Array.isArray(child)) {
			for (const entry of child) {
				if (entry?.type && containsTextRead(entry)) {
					return true;
				}
			}
		} else if (child?.type && containsTextRead(child)) {
			return true;
		}
	}

	return false;
}

/**
 * Return whether a node is an inline callback passed to an array search, such
 * as the arrow function in items.find(item => item.id === 1).
 *
 * @param  {object|undefined}  node
 *     The node to inspect, or undefined when a call has no arguments.
 *
 * @returns  {boolean}
 *     Whether the rule checks this callback's body for text reads.
 */
function isSearchCallback(node) {
	if (node?.type !== "ArrowFunctionExpression" && node?.type !== "FunctionExpression") {
		return false;
	}

	// The call the function is passed to, if it is passed to one.
	const call = node.parent;

	return (
		call?.type === "CallExpression" &&
		call.arguments[0] === node &&
		call.callee.type === "MemberExpression" &&
		!call.callee.computed &&
		searchMethods.has(call.callee.property.name)
	);
}

/**
 * Return whether a node itself reads an element's text, by calling text() or
 * reading textContent or innerText.
 *
 * @param  {object}  node
 *     The AST node to inspect.
 *
 * @returns  {boolean}
 *     Whether the node calls text() or reads a DOM text property.
 */
function isTextRead(node) {
	if (
		node.type === "CallExpression" &&
		node.callee.type === "MemberExpression" &&
		!node.callee.computed &&
		node.callee.property.name === "text"
	) {
		return true;
	}

	return (
		node.type === "MemberExpression" && !node.computed && textProperties.has(node.property.name)
	);
}

export default {
	meta: {
		docs: { description: "Find test elements by data-test attributes instead of visible text." },
		type: "problem",
	},

	/**
	 * Create the rule's node visitor.
	 *
	 * @param  {object}  context
	 *     The Oxlint rule context.
	 *
	 * @returns  {object}
	 *     The visitor for array search calls.
	 */
	createOnce(context) {
		return {
			/**
			 * Report an array search when its inline callback reads visible
			 * text.
			 *
			 * @param  {object}  node
			 *     The call expression being checked.
			 */
			CallExpression(node) {
				// Only an inline callback is checked, because a callback passed
				// by name has its body somewhere else.
				const callback = node.arguments[0];

				if (!isSearchCallback(callback) || !containsTextRead(callback.body)) {
					return;
				}

				context.report({
					message: "Find test elements by a data-test attribute instead of visible text.",
					node,
				});
			},
		};
	},
};
