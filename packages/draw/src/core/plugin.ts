// The plugin contract, core half. A feature of the whiteboard is a plugin of two halves in two
// entry points: this one, framework-free (it imports no React, no canvas React layer and no ui, so
// a read-only place, such as the SVG export at build time or a board preview in a Worker, loads it
// without loading an editor), and an editor half (`../react/plugin.ts`) with the tool, the drawing
// in the DOM, the inspector panel and the keys.
//
// The core half says what a plugin owns in the board's JSON (item kinds: their data, geometry, hit
// test, bounds, SVG painting), the rules it adds to the draw engine (hooks run inside the single
// undo step of the change that triggered them), how old kinds are migrated and which exports it
// brings. The registry composes a list of core halves: every function of the core takes that list.

import type { Bounds, FarPrimitive, ItemChange, KindDefinition, KindMap } from "@forgeron/canvas";
import type { GpuOptions } from "./gpu";
import type { PaintOptions, SvgNode } from "./svg";
import type { DrawData, DrawItem } from "./types";

export type Changes = Array<readonly [string, ItemChange<DrawData>]>;

/* ================================================================== Item kinds */

/** What the board knows about one kind of item. */
export interface KindSpec {
  /** The `data.type` its items carry (a rectangle, an ellipse and a diamond all say `shape`). */
  readonly type: string;
  /** Names the kind for people and assistive technology: `Rectangle`. */
  readonly label: string;
  /** The hit test and the resize rule the canvas engine uses. Default: the box, eight handles. */
  readonly canvas?: KindDefinition<DrawData>;
  /**
   * Checks the `data` of an item of this kind read from JSON and fills what may be left out.
   * Throws `DrawFormatError` for what it cannot read. `data.type` is checked before it is called.
   */
  parse(raw: Readonly<Record<string, unknown>>, at: string): DrawData;
  /** The nodes that draw an item, in world units: the editor renders them, the export writes them. */
  paint(item: DrawItem, options: PaintOptions): SvgNode[];
  /** What the item looks like from far, as canvas far primitives (zoom under `FAR_ZOOM`). */
  far?(item: DrawItem, frame?: Bounds): FarPrimitive[];
  /**
   * The item on the GPU at every zoom, as canvas primitives: the same drawing as `paint`, its words
   * as glyphs (`gpuText`) unless `options.words` is false (its field is open over it). `frame` is
   * the bounds of the frame that clips it. A kind without it is drawn in the DOM by `paint`.
   */
  gpu?(item: DrawItem, frame?: Bounds, options?: GpuOptions): FarPrimitive[];
  /** Its box hides what lies under it (a sticky note, an image): the words under it are cut. */
  opaque?(item: DrawItem): boolean;
  /** The words an item holds, for its accessible name. */
  words?(item: DrawItem): string;
  /** The base name of the file when this item alone is exported (a frame's name). */
  exportName?(item: DrawItem): string;
}

/** An item of an old version of a kind, as it comes from JSON before it is migrated. */
export interface RawItem {
  id: string;
  kind: string;
  [key: string]: unknown;
}

/* ================================================================== Engine rules */

export interface ChangeContext {
  /** The items before the change, by id. */
  readonly before: ReadonlyMap<string, DrawItem>;
  /** The items now, bottom first. */
  readonly items: ReadonlyArray<DrawItem>;
  /** The ids that are not the same object before and after, removed ones included. */
  readonly changed: ReadonlySet<string>;
}

export interface SettleContext {
  readonly before: ReadonlyMap<string, DrawItem>;
  readonly items: ReadonlyArray<DrawItem>;
  /** The items a change or a gesture touched: those whose place on the board is to be settled. */
  readonly ids: ReadonlySet<string>;
}

export interface RemoveContext {
  readonly before: ReadonlyMap<string, DrawItem>;
  readonly items: ReadonlyArray<DrawItem>;
  /** The ids of the items that are gone. */
  readonly removed: ReadonlySet<string>;
}

export interface CopyContext {
  /** The items that were copied (a duplicate, a paste), in the order of their copies. */
  readonly sources: ReadonlyArray<DrawItem>;
  /** Their copies, as the rules before this one left them. */
  readonly copies: ReadonlyArray<DrawItem>;
  /** A group id no item uses yet; the same `old` always gives the same new id within one copy. */
  newGroup(old: string): string;
}

/**
 * What a plugin adds to the draw engine. Every hook returns changes that the engine applies in the
 * same undo step as the change that triggered it, and may be left out. The engine calls them in the
 * order of the plugin list, in four stages after a change of the items:
 *   `carry`  → items that move with a changed item (a frame's);
 *   `remove` → what a deletion leaves behind;
 *   `settle` → where an item belongs (membership), when a change is final or a gesture ends;
 *   `follow` → dependents put back on what changed (arrows on their items).
 * `select` and `copy` run on those commands.
 */
export interface EngineRules {
  /** The ids a selection becomes: a group is selected together. */
  select?(items: ReadonlyArray<DrawItem>, ids: string[]): string[];
  carry?(c: ChangeContext): Changes;
  remove?(c: RemoveContext): Changes;
  settle?(c: SettleContext): Changes;
  follow?(c: ChangeContext): Changes;
  /** After a duplicate or a paste: the copies pointed at each other, not at the originals. */
  copy?(c: CopyContext): Changes;
}

/* ================================================================== Exports */

export interface ExportContext {
  /** Every item of the board (the host may have prepared them: images inlined...). */
  readonly items: ReadonlyArray<DrawItem>;
  /** What to export: the ids of a selection or of a frame. */
  readonly ids: ReadonlyArray<string>;
  readonly registry: Registry;
  /** Reads a token's value from the page, e.g. `getComputedStyle(el).getPropertyValue`. */
  readonly resolve?: (token: string) => string | undefined;
  /** A background colour (a token id or `#rrggbb`), or none. */
  readonly background?: string | null;
}

export interface ExportOutput {
  data: string | Blob;
  mime: string;
  /** The base name, without extension: a frame's name, or `selection`. */
  name: string;
}

/** One way out of the board: a file or the clipboard. */
export interface ExportSpec {
  /** Unique across the plugins: `svg`, `png`, `json`. */
  readonly id: string;
  /** For people: `SVG`. */
  readonly name: string;
  readonly mime: string;
  /** The file extension, without the dot. */
  readonly extension: string;
  /** Where it goes: a download (default) or the system clipboard. */
  readonly to?: "download" | "clipboard";
  /**
   * `false`: run on the items as the store has them. By default the editor readies them first
   * (images inlined as data URLs, since an SVG drawn as an image loads nothing).
   */
  readonly prepare?: boolean;
  /** `null` when there is nothing to export. */
  run(ctx: ExportContext): ExportOutput | null | Promise<ExportOutput | null>;
}

/** What a plugin adds to the SVG export, once per export. */
export interface SvgRules {
  /** Ids the export holds besides those asked for: a frame brings its items. */
  scope?(items: ReadonlyArray<DrawItem>, wanted: ReadonlySet<string>): Iterable<string>;
  /** An item exported alone is exactly its box, with no padding around (a frame). */
  standalone?(item: DrawItem): boolean;
  /** Definitions and a wrapper for the items being exported (clip paths for the frames' items). */
  layer?(items: ReadonlyArray<DrawItem>): {
    defs?: SvgNode[];
    /** The nodes of an item, wrapped; `undefined` leaves them as they are. */
    wrap?(item: DrawItem, nodes: SvgNode[]): SvgNode[] | undefined;
  };
}

/* ================================================================== The plugin */

export interface DrawPlugin {
  /** Unique, stable, short: `rectangle`, `arrow`. */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Ids of plugins that must be in the list too (and come first). */
  readonly requires?: readonly string[];
  /** The item kinds it owns, by `item.kind`. */
  readonly kinds?: Readonly<Record<string, KindSpec>>;
  /** Rules it adds to the draw engine. */
  readonly engineRules?: EngineRules;
  /** Old item kinds it still reads, turned into current items when a board is read. */
  readonly json?: { readonly migrate?: Readonly<Record<string, (item: RawItem) => RawItem>> };
  /** What it adds to the SVG export. */
  readonly svg?: SvgRules;
  /** The ways out of the board it brings. */
  readonly exports?: ReadonlyArray<ExportSpec>;
}

/** Typed identity: `definePlugin({ id: ... })` checks the shape and returns it. */
export function definePlugin<const P extends DrawPlugin>(plugin: P): P {
  return plugin;
}

/** A broken plugin list: a duplicate id, a missing dependency, a cycle, two owners of a kind. */
export class PluginError extends Error {
  override name = "PluginError";
}

/** A list of core halves, or the registry already built from it. */
export type Plugins = ReadonlyArray<DrawPlugin> | Registry;

/* ================================================================== The registry */

export interface Registry {
  /** The plugins in dependency order. */
  readonly plugins: ReadonlyArray<DrawPlugin>;
  has(pluginId: string): boolean;
  /** The kind spec of `item.kind`, when a plugin owns it. */
  kind(kind: string): KindSpec | undefined;
  /** An item kind a plugin owns, or one it still reads as a legacy kind. */
  knows(kind: string): boolean;
  /** The canvas engine's hit tests and resize rules of every kind. */
  readonly kinds: KindMap<DrawData>;
  /** The ids of the kinds, in plugin order. */
  readonly kindIds: ReadonlyArray<string>;
  /** The id of the plugin that owns a kind. */
  owner(kind: string): string | undefined;
  /** Turns a legacy item into its current form. */
  migrate(item: RawItem): RawItem;
  /** The engine rules that have each stage, in plugin order. */
  readonly rules: {
    readonly select: ReadonlyArray<NonNullable<EngineRules["select"]>>;
    readonly carry: ReadonlyArray<NonNullable<EngineRules["carry"]>>;
    readonly remove: ReadonlyArray<NonNullable<EngineRules["remove"]>>;
    readonly settle: ReadonlyArray<NonNullable<EngineRules["settle"]>>;
    readonly follow: ReadonlyArray<NonNullable<EngineRules["follow"]>>;
    readonly copy: ReadonlyArray<NonNullable<EngineRules["copy"]>>;
  };
  readonly svg: ReadonlyArray<SvgRules>;
  readonly exports: ReadonlyArray<ExportSpec>;
  export(id: string): ExportSpec | undefined;
}

/** Orders a plugin list by dependency and checks it. Throws `PluginError`. */
export function resolvePlugins<P extends { id: string; requires?: readonly string[] }>(
  list: ReadonlyArray<P>,
): P[] {
  const byId = new Map<string, P>();
  for (const plugin of list) {
    if (byId.has(plugin.id)) throw new PluginError(`Duplicate plugin id "${plugin.id}"`);
    byId.set(plugin.id, plugin);
  }
  const out: P[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (plugin: P, trail: string[]) => {
    const seen = state.get(plugin.id);
    if (seen === "done") return;
    if (seen === "visiting") {
      throw new PluginError(`Plugin dependency cycle: ${[...trail, plugin.id].join(" -> ")}`);
    }
    state.set(plugin.id, "visiting");
    for (const need of plugin.requires ?? []) {
      const dep = byId.get(need);
      if (!dep) throw new PluginError(`Plugin "${plugin.id}" requires "${need}", which is missing`);
      visit(dep, [...trail, plugin.id]);
    }
    state.set(plugin.id, "done");
    out.push(plugin);
  };
  for (const plugin of list) visit(plugin, []);
  return out;
}

/** Composes a plugin list into the lookups every function of the core uses. Throws `PluginError`. */
export function createRegistry(list: ReadonlyArray<DrawPlugin>): Registry {
  const plugins = resolvePlugins(list);
  const ids = new Set(plugins.map((p) => p.id));
  const specs = new Map<string, { spec: KindSpec; owner: string }>();
  const canvas: Record<string, KindDefinition<DrawData>> = {};
  const migrations = new Map<string, (item: RawItem) => RawItem>();
  const exports: ExportSpec[] = [];
  const exportOwners = new Map<string, string>();
  const rules = {
    select: [] as NonNullable<EngineRules["select"]>[],
    carry: [] as NonNullable<EngineRules["carry"]>[],
    remove: [] as NonNullable<EngineRules["remove"]>[],
    settle: [] as NonNullable<EngineRules["settle"]>[],
    follow: [] as NonNullable<EngineRules["follow"]>[],
    copy: [] as NonNullable<EngineRules["copy"]>[],
  };
  const svg: SvgRules[] = [];

  for (const plugin of plugins) {
    for (const [kind, spec] of Object.entries(plugin.kinds ?? {})) {
      const taken = specs.get(kind);
      if (taken) {
        throw new PluginError(
          `Kind "${kind}" of plugin "${plugin.id}" is already owned by "${taken.owner}"`,
        );
      }
      specs.set(kind, { spec, owner: plugin.id });
      canvas[kind] = spec.canvas ?? {};
    }
    for (const [kind, fn] of Object.entries(plugin.json?.migrate ?? {})) migrations.set(kind, fn);
    const r = plugin.engineRules;
    if (r) {
      if (r.select) rules.select.push(r.select);
      if (r.carry) rules.carry.push(r.carry);
      if (r.remove) rules.remove.push(r.remove);
      if (r.settle) rules.settle.push(r.settle);
      if (r.follow) rules.follow.push(r.follow);
      if (r.copy) rules.copy.push(r.copy);
    }
    if (plugin.svg) svg.push(plugin.svg);
    for (const spec of plugin.exports ?? []) {
      const taken = exportOwners.get(spec.id);
      if (taken) {
        throw new PluginError(
          `Export "${spec.id}" of plugin "${plugin.id}" is already offered by "${taken}"`,
        );
      }
      exportOwners.set(spec.id, plugin.id);
      exports.push(spec);
    }
  }
  const byExport = new Map(exports.map((e) => [e.id, e]));
  return {
    plugins,
    has: (id) => ids.has(id),
    kind: (kind) => specs.get(kind)?.spec,
    knows: (kind) => specs.has(kind) || migrations.has(kind),
    kinds: canvas,
    kindIds: [...specs.keys()],
    owner: (kind) => specs.get(kind)?.owner,
    migrate: (item) => migrations.get(item.kind)?.(item) ?? item,
    rules,
    svg,
    exports,
    export: (id) => byExport.get(id),
  };
}
