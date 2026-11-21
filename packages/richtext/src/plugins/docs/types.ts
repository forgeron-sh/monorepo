// The documentation of a plugin as data, so a catalog (the site, the gallery) lists every plugin
// the same way. No React, no Tiptap: this file only holds types.

export interface PluginDocOption {
  name: string;
  /** The TypeScript type, as written. */
  type: string;
  description: string;
  /** The default value, as written, when there is one. */
  default?: string;
}

export interface PluginDoc {
  /** The id of the plugin (`CorePlugin.id`). */
  id: string;
  /** The family it belongs to: `text`, `blocks`, `references`, `attachments`, `layout`, `media`... */
  family: string;
  name: string;
  summary: string;
  /** The subpath of its core half and of its editor half, as an app imports them. */
  core: string;
  editor: string;
  /** The plugins it needs (`CorePlugin.requires`). */
  requires?: ReadonlyArray<string>;
  /** What the app must provide for it to work (an `upload` function, a search source...). */
  options?: ReadonlyArray<PluginDocOption>;
  /** Markdown the plugin reads and writes, shown as a sample in the catalog. */
  markdown?: string;
  /** What the owner of an app should know: limits, how it degrades. */
  notes?: ReadonlyArray<string>;
  /** A TypeScript snippet that uses it. */
  usage: string;
}
