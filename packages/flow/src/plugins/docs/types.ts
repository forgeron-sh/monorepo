// The documentation of a plugin as data, so a catalog (the site, the gallery) lists every plugin
// the same way. No React, no canvas: this file only holds types.

export interface PluginDocOption {
  name: string;
  /** The TypeScript type, as written. */
  type: string;
  description: string;
  /** The default value, as written, when there is one. */
  default?: string;
}

export interface PluginDoc {
  /** The id of the plugin (`FlowCorePlugin.id`). */
  id: string;
  /** The family it belongs to: `nodes`, `edges`, `connection`, `layout`, `groups`, `run`, `clipboard`, `interface`. */
  family: string;
  name: string;
  summary: string;
  /** The subpath of its core half and of its editor half, as an app imports them. */
  core: string;
  editor: string;
  /** The plugins it needs (`FlowCorePlugin.requires`). */
  requires?: ReadonlyArray<string>;
  /** What the app must provide, or may tune, for it to work (a prop, a `ConnectOptions` field...). */
  options?: ReadonlyArray<PluginDocOption>;
  /** A fragment of flow JSON (version 1) that shows what the plugin reads or writes. */
  json?: string;
  /** What the owner of an app should know: limits, how it degrades. */
  notes?: ReadonlyArray<string>;
  /** A TypeScript snippet that uses it. */
  usage: string;
}
