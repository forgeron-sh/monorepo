// The documentation of a plugin as data, so a catalog (the gallery, a site) lists every plugin the
// same way. No React: this file only holds types.

export interface PluginDocOption {
  name: string;
  /** The TypeScript type, as written. */
  type: string;
  description: string;
  /** The default value, as written, when there is one. */
  default?: string;
}

export interface PluginDoc {
  /** The id of the plugin (`DrawPlugin.id`). */
  id: string;
  /** The family it belongs to: `shapes`, `notes`, `lines`, `layout`, `media`, `export`, `ui`. */
  family: string;
  name: string;
  summary: string;
  /** The subpath of its core half and of its editor half, as an app imports them. */
  core: string;
  editor: string;
  /** The plugins it needs (`DrawPlugin.requires`). */
  requires?: ReadonlyArray<string>;
  /** What the app must provide for it to work, or may tune. */
  options?: ReadonlyArray<PluginDocOption>;
  /** A fragment of the board's JSON the plugin reads and writes, shown as a sample in the catalog. */
  json?: string;
  /** What the owner of an app should know: keys, limits, how it degrades. */
  notes?: ReadonlyArray<string>;
  /** A TypeScript snippet that uses it. */
  usage: string;
}
