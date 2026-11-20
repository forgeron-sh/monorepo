// The plugin contract, editor half. Where the core half (`../core/plugin.ts`) says what a plugin is
// in the board's JSON, this one says how it behaves in the editor: its tools and their keys, how its
// items look in the DOM, its inspector panels, its menu items, its keys, its exports that need a
// browser, and what it adds to the slots of the interface. Slots are named places the editor reads:
// the content plugins contribute, the interface plugins (`toolbar`, `inspector`, `minimap`) draw.
//
// A plugin's editor half holds the editor it was given only through the `EditorContext` the editor
// passes to its factories, so the editor remounts its body when the list of plugins changes.

import type { CanvasTool, ConnectionEnd, ItemChange, Point } from "@forgeron/canvas";
import type { CanvasToolApi } from "@forgeron/canvas/react";
import type { IconDefinition } from "@forgeron/icons";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { DrawStore } from "../core/engine";
import {
  createRegistry,
  PluginError,
  resolvePlugins,
  type DrawPlugin,
  type ExportSpec,
  type Registry,
} from "../core/plugin";
import type { DrawStyle } from "../core/style";
import type { DrawData, DrawItem } from "../core/types";
import type { Signal } from "./signal";

export type DrawTool = CanvasTool<CanvasToolApi<DrawData>>;

/* ================================================================== The editor's context */

/** What a plugin can read and do in the editor it lives in; always current (read it when you need it). */
export interface EditorContext {
  readonly store: DrawStore;
  /** The registry of the editor's plugins: kinds, rules, exports. */
  readonly registry: Registry;
  /** Whether a plugin is in the editor's list. */
  has(pluginId: string): boolean;
  /** The style new items take: the inspector's last choices. */
  style(): DrawStyle;
  setStyle(next: DrawStyle): void;
  /** Opens the text of an item for typing; `key` merges the typing with the add in one step. */
  edit(id: string, key: string, grow: boolean): void;
  /** A new merge key for an add followed by typing. */
  editKey(): string;
  /** A value that changes many times a second (a pen's points) and has its own previews. */
  signal<T>(name: string, initial: T): Signal<T>;
  /** The element that wraps the editor. */
  root(): HTMLElement | null;
  items(): DrawItem[];
  selected(): DrawItem[];
  /** Runs one export (core or editor half) on `ids`: a download or the clipboard. */
  runExport(id: string, ids: string[]): Promise<void>;
}

/* ================================================================== Tools */

export interface ToolSpec extends DrawTool {
  /** In the tool dock: its icon, and the group it sits in (a thin line separates groups). */
  dock?: { icon: IconDefinition; group: string };
  /** The `data.type` this tool draws: the inspector shows that type's panel while it is active. */
  draws?: string;
}

/* ================================================================== Items in the DOM */

export interface ItemViewOptions {
  idPrefix: string;
  /** The bounds of the frame that clips the item. */
  frame?: { x: number; y: number; w: number; h: number };
  /** The item's text is being typed: a field replaces it. */
  editing?: {
    value: string;
    onChange: (text: string, height: number | null) => void;
    onDone: (cancel: boolean) => void;
  };
  /** The item is the single one selected (an arrow shows its ends to drag them). */
  solo?: boolean;
  /**
   * Far out (a zoom under `FAR_ZOOM`): shapes, notes and texts are drawn as plain boxes, with no
   * pattern and no words, which nobody reads at that size and which cost the most to paint.
   */
  far?: boolean;
  /**
   * The GPU draws the item (`KindSpec.gpu`): only what it does not draw is in the DOM, the
   * kind's `content` (its words, its field while it is typed, an arrow's ends).
   */
  overlay?: boolean;
  /** With `overlay`: the opaque boxes above the item, world units; its words are cut there. */
  above?: ReadonlyArray<{ x: number; y: number; w: number; h: number }>;
}

/** How a kind looks and behaves in the DOM, beyond its paint (`KindSpec.paint`, shared with the export). */
export interface KindView {
  /** DOM on top of the item's paint: its words, its name, the handles of its ends. */
  content?(item: DrawItem, options: ItemViewOptions): ReactNode;
  /** More CSS on the item's box (`style` on the element). */
  style?(item: DrawItem): CSSProperties | undefined;
  /** Far out, the item as a plain box: its CSS, or `null` for the full view. */
  farStyle?(item: DrawItem): CSSProperties | null;
  /** Far out, a view of its own that replaces the item's (a stroke is its line). */
  farNode?(item: DrawItem, options: ItemViewOptions): ReactNode;
  /** Its words can be typed in place: double-click or Enter opens a field. */
  text?: {
    /** The change a new text makes to the item, or `null`. */
    type(
      item: DrawItem,
      text: string,
      measured: number | null,
      grow: boolean,
    ): ItemChange<DrawData> | null;
    /** Typing ended: should the item go (an empty text)? */
    discard?(item: DrawItem, cancel: boolean): boolean;
  };
  /**
   * With the GPU drawing it: whether the item shows something in the DOM over that drawing from
   * `FAR_ZOOM` up (its words, a name). The DOM holds only the items that do.
   */
  overlay?(item: DrawItem): boolean;
  /** Stays in the DOM when the board is seen from far while it is the single selected item. */
  keepWhenSolo?: boolean;
  /** The token the minimap draws it in. */
  minimapColor?: string;
}

/* ================================================================== The inspector */

export interface PanelProps {
  store: DrawStore;
  style: DrawStyle;
  onStyle(style: DrawStyle): void;
  ctx: EditorContext;
  /** The selected items. */
  selected: ReadonlyArray<DrawItem>;
  /** The data of the first selected item when it is of `type`. */
  dataOf<D extends DrawData>(type: D["type"]): D | undefined;
  /**
   * Changes every selected item that `change` answers for, and the style of what comes next, in
   * one undo step; repeated edits of the same `field` on the same selection merge.
   */
  edit(
    field: string,
    change: (item: DrawItem) => ItemChange<DrawData> | null,
    next?: Partial<DrawStyle>,
  ): void;
}

/** A panel of the properties panel for one `data.type`: shown when the selection (or the tool) is of it. */
export interface PanelSpec {
  /** Unique; plugins that share a panel (the three shapes) give it the same id: the first counts. */
  id: string;
  /** The `data.type` it edits. */
  type: string;
  Component: ComponentType<PanelProps>;
}

export interface MenuState {
  selected: ReadonlyArray<DrawItem>;
  items: ReadonlyArray<DrawItem>;
}

/** A button of the properties panel's action rows (and of any menu built from them). */
export interface MenuItem {
  /** Unique; the first of two with one id counts. */
  id: string;
  /** Items of one section sit in one toolbar, named after it: `arrange`, `align`, `export`. */
  section: string;
  /** Left to right, top to bottom, lower first. Default 100. */
  order?: number;
  icon: IconDefinition | ((state: MenuState) => IconDefinition);
  label: string | ((state: MenuState) => string);
  run(ctx: EditorContext, state: MenuState): void;
  /** Hidden when it answers `false`. */
  when?(state: MenuState): boolean;
  disabled?(state: MenuState): boolean;
}

/* ================================================================== Keys, surface, the rest */

export interface KeySpec {
  /** One combo (`mod+g`) or several: the key of ui's `matchShortcut`. */
  combo: string | ReadonlyArray<string>;
  /** Runs before the canvas sees the key (a paste that reads the system clipboard). */
  capture?: boolean;
  /** The editor skips keys typed in a field. */
  run(ctx: EditorContext, event: KeyInput): void;
}

/** The key event a `KeySpec` receives: React's, as far as a shortcut needs it. */
export interface KeyInput {
  readonly nativeEvent: KeyboardEvent;
  preventDefault(): void;
  stopPropagation(): void;
}

/** A button of the tool dock that is not a tool (an image file picker). */
export interface ToolbarButtonSpec {
  id: string;
  label: string;
  icon: IconDefinition;
  run(ctx: EditorContext): void;
}

/** A layer in world space above the items: a preview, highlights. */
export interface OverlaySpec {
  id: string;
  Component: ComponentType<{ ctx: EditorContext }>;
}

/** Dragging the end of an item onto another one (an arrow's end). */
export interface ConnectSpec {
  canConnect(ctx: EditorContext, from: ConnectionEnd, to: ConnectionEnd): boolean;
  onConnect(ctx: EditorContext, from: ConnectionEnd, to: ConnectionEnd | null, point: Point): void;
}

/** Files dropped on the editor. */
export interface DropSpec {
  accept(file: File): boolean;
  add(ctx: EditorContext, file: File, at?: Point): void;
}

/** What the interface plugins receive. */
export interface UiProps {
  ctx: EditorContext;
  slots: Slots;
  style: DrawStyle;
  onStyle(style: DrawStyle): void;
}

export interface UiComponent {
  id: string;
  /** Before the zoom controls (default) or after them in the DOM: the order keys tab through. */
  placement?: "before-zoom" | "after-zoom";
  Component: ComponentType<UiProps>;
}

/** The contributions of all the plugins, by slot. */
export interface Slots {
  readonly registry: Registry;
  /** The tools, in plugin order. */
  readonly tools: ReadonlyArray<ToolSpec>;
  readonly kinds: ReadonlyMap<string, KindView>;
  readonly panels: ReadonlyArray<PanelSpec>;
  readonly menu: ReadonlyArray<MenuItem>;
  readonly toolbar: ReadonlyArray<ToolbarButtonSpec>;
  readonly keys: ReadonlyArray<KeySpec>;
  readonly overlays: ReadonlyArray<OverlaySpec>;
  readonly ui: ReadonlyArray<UiComponent>;
  readonly connect: ConnectSpec | undefined;
  /** What a double click on the empty board does: the first that answers `true` handles it. */
  readonly doubleClick: ReadonlyArray<(ctx: EditorContext, point: Point) => boolean | void>;
  readonly drops: ReadonlyArray<DropSpec>;
  /** Every export of the editor, by id: the core halves' and the editor halves'. */
  readonly exports: ReadonlyMap<string, ExportSpec>;
  /** Items whose `data[field]` names an item of `data.type === type` are clipped by it. */
  readonly clips: ReadonlyArray<{ type: string; field: string }>;
}

/* ================================================================== The plugin */

export interface EditorPlugin {
  /** The framework-free half: kinds, rules, exports, ids. */
  core: DrawPlugin;
  /** How its kinds look and behave in the DOM, by kind id. */
  kinds?: Readonly<Record<string, KindView>>;
  /** Slot `tools`: its tools, made for the editor they are given. */
  tools?: (ctx: EditorContext) => ReadonlyArray<ToolSpec>;
  /** Slot `panels`: inspector panels per data type. */
  panels?: ReadonlyArray<PanelSpec>;
  /** Slot `menu`: buttons of the action rows. */
  menu?: ReadonlyArray<MenuItem>;
  /** Slot `toolbar`: buttons of the tool dock that are not tools. */
  toolbar?: ReadonlyArray<ToolbarButtonSpec>;
  /** Slot `keys`: keyboard shortcuts of the editor. */
  keys?: ReadonlyArray<KeySpec>;
  /** Slot `overlays`: layers above the items. */
  overlays?: ReadonlyArray<OverlaySpec>;
  /** Slot `ui`: components next to the canvas (the interface plugins draw the dock, the panel...). */
  ui?: ReadonlyArray<UiComponent>;
  /** Slot `connect`: dragging an item's end onto another item. */
  connect?: ConnectSpec;
  /** Slot `surface`: a double click on the empty board, in world units; return `true` when handled. */
  surface?: { doubleClick?(ctx: EditorContext, point: Point): boolean | void };
  /** Slot `drop`: files dropped on the editor. */
  drop?: DropSpec;
  /** Exports that need a browser (a PNG on a canvas); their ids join the core halves'. */
  exports?: ReadonlyArray<ExportSpec>;
  /** Items kept by the data type of the container that clips them (a frame's). */
  clip?: { type: string; field: string };
  /** Readies the items before an export: images are inlined as data URLs. */
  prepareExport?(items: ReadonlyArray<DrawItem>): Promise<DrawItem[]>;
}

/** Typed identity for an editor half. */
export function defineEditorPlugin<const P extends EditorPlugin>(plugin: P): P {
  return plugin;
}

/* ================================================================== The editor's registry */

export interface EditorRegistry {
  /** The editor halves in dependency order. */
  readonly plugins: ReadonlyArray<EditorPlugin>;
  /** The registry of the core halves. */
  readonly registry: Registry;
  /** Every export of the editor, by id: the core halves' and the editor halves'. */
  readonly exports: ReadonlyMap<string, ExportSpec>;
  /** Readies the exports' items: every `prepareExport`, in plugin order. */
  prepare(items: ReadonlyArray<DrawItem>): Promise<DrawItem[]>;
  /** Makes the slots for one editor: instantiates the tools with its context. */
  slots(ctx: EditorContext): Slots;
}

const once = <T extends { id: string }>(list: T[], item: T) => {
  if (!list.some((x) => x.id === item.id)) list.push(item);
};

/** Composes a list of editor halves. Throws `PluginError` for a broken list. */
export function createEditorRegistry(list: ReadonlyArray<EditorPlugin>): EditorRegistry {
  const ordered = resolvePlugins(list.map((p) => ({ ...p.core, editor: p }))).map((p) => p.editor);
  const registry = createRegistry(ordered.map((p) => p.core));
  const kinds = new Map<string, KindView>();
  const panels: PanelSpec[] = [];
  const menu: MenuItem[] = [];
  const toolbar: ToolbarButtonSpec[] = [];
  const keys: KeySpec[] = [];
  const overlays: OverlaySpec[] = [];
  const ui: UiComponent[] = [];
  const drops: DropSpec[] = [];
  const doubleClick: Array<NonNullable<NonNullable<EditorPlugin["surface"]>["doubleClick"]>> = [];
  const clips: Array<{ type: string; field: string }> = [];
  const exports = new Map<string, ExportSpec>(registry.exports.map((e) => [e.id, e]));
  let connect: ConnectSpec | undefined;

  for (const plugin of ordered) {
    for (const [kind, view] of Object.entries(plugin.kinds ?? {})) {
      if (!registry.kind(kind)) {
        throw new PluginError(
          `Plugin "${plugin.core.id}" gives a view to kind "${kind}", which no plugin of the list owns`,
        );
      }
      kinds.set(kind, view);
    }
    for (const p of plugin.panels ?? []) once(panels, p);
    for (const m of plugin.menu ?? []) once(menu, m);
    for (const b of plugin.toolbar ?? []) once(toolbar, b);
    for (const k of plugin.keys ?? []) keys.push(k);
    for (const o of plugin.overlays ?? []) once(overlays, o);
    for (const u of plugin.ui ?? []) once(ui, u);
    if (plugin.drop) drops.push(plugin.drop);
    if (plugin.surface?.doubleClick) doubleClick.push(plugin.surface.doubleClick);
    if (plugin.clip) clips.push(plugin.clip);
    connect ??= plugin.connect;
    for (const e of plugin.exports ?? []) {
      if (exports.has(e.id)) {
        throw new PluginError(`Export "${e.id}" of plugin "${plugin.core.id}" is already offered`);
      }
      exports.set(e.id, e);
    }
  }
  menu.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  return {
    plugins: ordered,
    registry,
    exports,
    async prepare(items) {
      let out = [...items];
      for (const plugin of ordered) if (plugin.prepareExport) out = await plugin.prepareExport(out);
      return out;
    },
    slots(ctx) {
      const tools: ToolSpec[] = [];
      for (const plugin of ordered) if (plugin.tools) tools.push(...plugin.tools(ctx));
      return {
        registry,
        tools,
        kinds,
        panels,
        menu,
        toolbar,
        keys,
        overlays,
        ui,
        connect,
        doubleClick,
        drops,
        exports,
        clips,
      };
    },
  };
}
