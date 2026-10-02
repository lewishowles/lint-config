import base from "./base.json" with { type: "json" };
import comments from "./comments.json" with { type: "json" };
import vueConfig from "./vue.json" with { type: "json" };

// The Vue layer. It includes base as an object because Oxlint rejects the file
// path that vue.json uses to extend base.
export const vue = { ...vueConfig, extends: [base] };

/**
 * Build a Vite+ lint block from the selected layers and local settings.
 *
 * @param  {object[]}  layers
 *     The layer objects to extend. When two layers set the same env or global,
 *     the later layer's value is used.
 * @param  {object}  local
 *     Project settings that take priority over the layers. Its extends list is
 *     ignored, so every layer must be passed in layers.
 *
 * @returns  {object}
 *     A lint block with inherited environments and globals at the top level.
 */
export function lintConfig(layers, local = {}) {
	// The environments inherited from the selected layers.
	const env = {};
	// The globals inherited from the selected layers.
	const globals = {};

	for (const layer of layers) {
		collectEnvAndGlobals(layer, env, globals);
	}

	return {
		...local,
		env: { ...env, ...local.env },
		globals: { ...globals, ...local.globals },
		extends: layers,
	};
}

/**
 * Copy a layer's env and globals into the collected values. The layers it
 * extends are copied first, so the layer's own values win.
 *
 * @param  {object}  layer
 *     The layer to read, along with every layer it extends.
 * @param  {object}  env
 *     The collected environments, updated in place.
 * @param  {object}  globals
 *     The collected globals, updated in place.
 */
function collectEnvAndGlobals(layer, env, globals) {
	for (const extendedLayer of layer.extends ?? []) {
		collectEnvAndGlobals(extendedLayer, env, globals);
	}

	Object.assign(env, layer.env);
	Object.assign(globals, layer.globals);
}

export { base, comments };
