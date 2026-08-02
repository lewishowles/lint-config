import { hasImmediateLineComment } from "../utils/source.js";

// The built-in APIs that require a preceding comment by default.
const builtInApis = new Set([
	"onBeforeMount",
	"onMounted",
	"onBeforeUpdate",
	"onUpdated",
	"onBeforeUnmount",
	"onUnmounted",
	"onActivated",
	"onDeactivated",
	"onErrorCaptured",
	"onRenderTracked",
	"onRenderTriggered",
	"onServerPrefetch",
	"watch",
	"watchEffect",
	"watchPostEffect",
	"watchSyncEffect",
	"onClickOutside",
]);

/**
 * Return whether a call is the documented initializer of a variable
 * declaration.
 *
 * @param  {object}  sourceCode
 *     The Oxlint source code object.
 * @param  {object}  node
 *     The call expression node.
 *
 * @returns  {boolean}
 *     Whether the call is directly initialized by a documented declaration.
 */
function hasDocumentedVariableDeclaration(sourceCode, node) {
	// The call's enclosing variable declarator, when there is one.
	const declarator = node.parent;

	if (declarator?.type !== "VariableDeclarator" || declarator.init !== node) {
		return false;
	}

	// The declarator's enclosing variable declaration.
	const declaration = declarator.parent;

	return (
		declaration?.type === "VariableDeclaration" && hasImmediateLineComment(sourceCode, declaration)
	);
}

/**
 * Return the configured API names for the rule.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 *
 * @returns  {Set<string>}
 *     The built-in and configured API names.
 */
function getConfiguredApis(context) {
	// The rule's resolved options for the file currently being visited.
	const options = context.options?.[0];
	// The project-configured API names to add to the built-in list.
	const additionalApis = options?.additionalApis ?? [];

	return new Set([...builtInApis, ...additionalApis]);
}

/**
 * Create the configured API call comment rule.
 *
 * @returns  {object}
 *     The Oxlint rule definition.
 */
export default {
	meta: {
		docs: { description: "Require comments before configured API calls." },
		type: "suggestion",
		schema: [
			{
				type: "object",
				properties: {
					additionalApis: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
			},
		],
		defaultOptions: [{ additionalApis: [] }],
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
			 * Check a configured API call for a preceding comment.
			 *
			 * @param  {object}  node
			 *     The call expression node.
			 */
			CallExpression(node) {
				// Read fresh for every call: createOnce's visitor is shared across every file
				// in the run, so caching this at closure-creation time would freeze the first
				// file's options.
				const configuredApis = getConfiguredApis(context);

				if (node.callee.type !== "Identifier" || !configuredApis.has(node.callee.name)) {
					return;
				}

				if (
					hasDocumentedVariableDeclaration(context.sourceCode, node) ||
					hasImmediateLineComment(context.sourceCode, node)
				) {
					return;
				}

				context.report({
					message: "Configured API calls require an immediately preceding line comment.",
					node,
				});
			},
		};
	},
};
