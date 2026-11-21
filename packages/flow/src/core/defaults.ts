// The default plugin list of the core's functions: the `full` preset's core halves. Every function
// that takes `plugins` falls back to it, so a call that names none behaves as the editor always
// has.

import { fullCorePlugins } from "../plugins/index";
import { createRegistry, registryOf, type Plugins, type Registry } from "./plugin";

export const DEFAULT_REGISTRY: Registry = createRegistry(fullCorePlugins);

/** The registry of a plugin list (cached by the array), a registry as is, the default when none. */
export function registryOrDefault(plugins?: Plugins): Registry {
  return plugins === undefined ? DEFAULT_REGISTRY : registryOf(plugins);
}
