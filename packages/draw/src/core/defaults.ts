// The default plugin list of the core's functions: the `full` preset's core halves. Every function
// that takes `plugins` falls back to it, so a call that names none reads and writes everything the
// bundled plugins know.

import { fullCorePlugins } from "../plugins/index";
import { createRegistry, type Plugins, type Registry } from "./plugin";

export const DEFAULT_REGISTRY: Registry = createRegistry(fullCorePlugins);

const cache = new WeakMap<ReadonlyArray<unknown>, Registry>();

const isRegistry = (plugins: Plugins): plugins is Registry => !Array.isArray(plugins);

/** The registry of a plugin list (cached by the array), a registry as is, the default when none. */
export function registryOf(plugins?: Plugins): Registry {
  if (plugins === undefined) return DEFAULT_REGISTRY;
  if (isRegistry(plugins)) return plugins;
  const list = plugins as ReadonlyArray<unknown>;
  let registry = cache.get(list);
  if (!registry) {
    registry = createRegistry(plugins as ReadonlyArray<never>);
    cache.set(list, registry);
  }
  return registry;
}
