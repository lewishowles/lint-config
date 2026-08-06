import { getCommentNeighbours, isDirectiveComment, isLeadingComment } from "../utils/source.js";
import { getObjectArgument, getObjectProperties, isNamedCall } from "../utils/vue-macro.js";

// Matches the single newline and indentation allowed between a comment and an
// event.
const immediateCommentGapPattern = /^\r?\n[ \t]*$/;

// The message shared by all undocumented runtime events.
const missingCommentMessage =
	"Vue emit declarations require an immediately preceding block comment.";

/**
 * Return whether the current lint target is a physical Vue single-file
 * component.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 *
 * @returns  {boolean}
 *     Whether the current file has a Vue filename.
 */
function isVueFile(context) {
	try {
		// Use the physical path because the AST does not identify Vue files.
		const physicalFilename = context.physicalFilename;

		return typeof physicalFilename === "string" && physicalFilename.endsWith(".vue");
	} catch {
		return false;
	}
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
 * Report missing comments for runtime emit events.
 *
 * @param  {object}  context
 *     The Oxlint rule context.
 * @param  {object}  objectExpression
 *     The runtime emits object to inspect.
 */
function reportEventDocumentation(context, objectExpression) {
	for (const property of getObjectProperties(objectExpression)) {
		// Checks whether this event has the required documentation.
		const hasDocumentation = hasBlockComment(context.sourceCode, property);

		if (!hasDocumentation) {
			context.report({ message: missingCommentMessage, node: property });

			continue;
		}
	}
}

export default {
	meta: {
		docs: { description: "Require block comments for Vue runtime emits." },
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
			 * Check runtime defineEmits calls for event documentation.
			 *
			 * @param  {object}  node
			 *     The call expression to inspect.
			 */
			CallExpression(node) {
				if (!isVueFile(context) || !isNamedCall(node, "defineEmits")) {
					return;
				}

				// Array and type-only forms have no runtime properties to document.
				const emitsObject = getObjectArgument(node, 0);

				if (emitsObject) {
					reportEventDocumentation(context, emitsObject);
				}
			},
		};
	},
};
