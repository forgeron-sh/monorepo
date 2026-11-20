// <DrawEditor>: the whiteboard. The canvas of @forgeron/canvas (select, move, resize, undo, zoom,
// pan) and the plugins it is given: each plugin's tools, how its items look in the DOM, its keys,
// its exports and what it adds to the slots of the interface. The tool dock, the properties panel
// and the minimap are plugins too; the zoom controls are the canvas's. The editor itself only hosts.

import { screenToWorld, type ConnectionEnd, type Item, type Point } from "@forgeron/canvas";
import {
  Canvas,
  textMetrics,
  useCanvasState,
  ZoomControls,
  type FarDraw,
} from "@forgeron/canvas/react";
import { matchShortcut } from "@forgeron/ui";
import {
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ComponentType,
} from "react";
import type { DrawStore } from "../core/engine";
import { FAR_ZOOM } from "../core/far";
import { registryOf } from "../core/defaults";
import type { Plugins } from "../core/plugin";
import { DEFAULT_STYLE, type DrawStyle } from "../core/style";
import { setTextMetrics } from "../core/text";
import type { DrawData, DrawItem } from "../core/types";
import { editorPresets } from "../plugins/editor/presets";
import { download, fileName, tokenReader } from "./export";
import { DrawItemView } from "./render";
import {
  createEditorRegistry,
  type EditorContext,
  type EditorPlugin,
  type ItemViewOptions,
  type Slots,
  type UiProps,
} from "./plugin";
import { createSession, createSignal, type Signal } from "./signal";

/** World units of a container's strip that hold its words (a frame's name). */
const CONTAINER_STRIP = 24;

/** Names an item for assistive technology: its kind and its words; unsupported ones say so. */
/**
 * A part of the interface a plugin brings: rendered again when its props change, not with every
 * change of the editor (a drag re-renders the editor each step; the dock has nothing new to show).
 */
const UiSlot = memo(function UiSlot({
  Component,
  ...props
}: UiProps & { Component: ComponentType<UiProps> }) {
  return <Component {...props} />;
});

export function drawItemLabel(item: Item<DrawData>, plugins?: Plugins): string {
  const spec = registryOf(plugins).kind(item.kind);
  if (!spec) return `Unsupported item: ${item.kind}`;
  const words = spec.words?.(item as DrawItem) ?? "";
  return words ? `${spec.label}: ${words.slice(0, 80)}` : spec.label;
}

interface Editing {
  id: string;
  key: string;
  /** A new text: its width follows what is typed. */
  grow: boolean;
}

export interface DrawEditorProps {
  store: DrawStore;
  /**
   * The editor halves of the plugins this editor is made of; the list is the whole configuration.
   * Keep it in module scope: a new list rebuilds the editor body. Give the same plugins (their
   * `core` halves) to the store: `useDrawStore({ plugins })`.
   */
  plugins?: ReadonlyArray<EditorPlugin>;
  /** A named list of plugins, sugar for `plugins`: `full` (default), `sketch`, `minimal`. */
  variant?: keyof typeof editorPresets;
  /** Names the board for assistive technology. */
  label?: string;
  /** Shows the properties panel (the `inspector` plugin). Default `true`. */
  inspector?: boolean;
  /** Shows the minimap (the `minimap` plugin). Default `true`. */
  minimap?: boolean;
  /** The style of new items at first. */
  defaultStyle?: Partial<DrawStyle>;
  className?: string;
  style?: CSSProperties;
}

const listIds = new WeakMap<object, number>();
let nextListId = 0;
const listId = (list: object) => {
  let id = listIds.get(list);
  if (id === undefined) listIds.set(list, (id = ++nextListId));
  return id;
};

export function DrawEditor({
  plugins,
  variant = "full",
  inspector = true,
  minimap = true,
  ...rest
}: DrawEditorProps) {
  const base = plugins ?? editorPresets[variant];
  const list = useMemo(
    () =>
      base.filter(
        (p) => !(p.core.id === "inspector" && !inspector) && !(p.core.id === "minimap" && !minimap),
      ),
    [base, inspector, minimap],
  );
  // The plugins that draw the interface hold the editor they were given: a new list, a new body.
  return <DrawEditorBody key={listId(list)} plugins={list} {...rest} />;
}

function DrawEditorBody({
  store,
  plugins,
  label = "Whiteboard",
  defaultStyle,
  className,
  style: css,
}: Omit<DrawEditorProps, "plugins" | "variant" | "inspector" | "minimap"> & {
  plugins: ReadonlyArray<EditorPlugin>;
}) {
  const prefix = `fgd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // The element that wraps the editor, read when a handler runs, never while rendering.
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootOf] = useState(() => () => rootRef.current);
  const reg = useMemo(() => createEditorRegistry(plugins), [plugins]);
  const registry = reg.registry;
  const [style, setStyleState] = useState<DrawStyle>(() => ({
    ...DEFAULT_STYLE,
    ...defaultStyle,
  }));
  const [editing, setEditing] = useState<Editing | null>(null);
  // What the tools and the handlers read when they run, outside of rendering: the last style,
  // the text being typed, the counter of merge keys.
  const [live] = useState(() => createSession<DrawStyle, Editing>(style));
  const [signals] = useState(() => new Map<string, Signal<unknown>>());

  // Texts are laid out with the metrics of the fonts the page uses, as the DOM would lay them out:
  // the GPU's words, the heights of notes and texts, the export. Again when a font has loaded.
  const [textVersion, setTextVersion] = useState(0);
  useLayoutEffect(() => {
    const root = rootRef.current;
    const metrics = root ? textMetrics(root) : null;
    if (!metrics) return;
    setTextMetrics(metrics);
    setTextVersion((v) => v + 1);
    return metrics.subscribe(() => setTextVersion((v) => v + 1));
  }, []);

  const items = useCanvasState(store, (s) => s.items) as ReadonlyArray<DrawItem>;
  const selection = useCanvasState(store, (s) => s.selection);

  const setStyle = useCallback(
    (next: DrawStyle) => {
      live.setStyle(next);
      setStyleState(next);
    },
    [live],
  );
  const startEditing = useCallback(
    (id: string, key: string, grow: boolean) => {
      const next = { id, key, grow };
      live.setEditing(next);
      setEditing(next);
    },
    [live],
  );

  const ctx: EditorContext = useMemo(() => {
    const self: EditorContext = {
      store,
      registry,
      has: (id) => registry.has(id),
      style: () => live.style(),
      setStyle,
      edit: startEditing,
      editKey: () => live.nextKey(),
      signal<T>(name: string, initial: T): Signal<T> {
        let s = signals.get(name);
        if (!s) signals.set(name, (s = createSignal<unknown>(initial)));
        return s as Signal<T>;
      },
      root: rootOf,
      items: () => store.getState().items as DrawItem[],
      selected: () => store.selectedItems() as DrawItem[],
      async runExport(id, ids) {
        const spec = reg.exports.get(id);
        if (!spec || ids.length === 0) return;
        const all = store.getState().items as DrawItem[];
        const prepared = spec.prepare === false ? all : await reg.prepare(all);
        const resolve = tokenReader(rootOf());
        const out = await spec.run({
          items: prepared,
          ids,
          registry,
          background: "bg",
          ...(resolve ? { resolve } : {}),
        });
        if (!out) return;
        if (spec.to === "clipboard") {
          if (typeof out.data === "string") {
            void navigator.clipboard?.writeText(out.data).catch(() => undefined);
          }
        } else download(out.data, fileName(out.name, spec.extension), out.mime);
      },
    };
    return self;
  }, [store, registry, reg, live, setStyle, startEditing, signals, rootOf]);

  const slots: Slots = useMemo(() => reg.slots(ctx), [reg, ctx]);

  /* ---- text typed in place */

  const finishEditing = useCallback(
    (cancel: boolean) => {
      const e = live.editing();
      if (!e) return;
      live.setEditing(null);
      setEditing(null);
      const item = store.get(e.id) as DrawItem | undefined;
      if (!item) return;
      // An empty text is no text: it goes, merged with its add into nothing.
      if (slots.kinds.get(item.kind)?.text?.discard?.(item, cancel)) {
        store.remove([e.id], { coalesce: e.key });
      }
      rootOf()?.querySelector<HTMLElement>(".fg-canvas")?.focus({ preventScroll: true });
    },
    [store, live, slots, rootOf],
  );

  const typeText = useCallback(
    (text: string, measured: number | null) => {
      const e = live.editing();
      const item = e ? (store.get(e.id) as DrawItem | undefined) : undefined;
      if (!e || !item) return;
      const change = slots.kinds.get(item.kind)?.text?.type(item, text, measured, e.grow);
      if (change) store.update(e.id, change, { label: "Type", coalesce: e.key });
    },
    [store, live, slots],
  );

  const onActivate = useCallback(
    (item: Item<DrawData>) => {
      if (item.locked || !slots.kinds.get(item.kind)?.text) return;
      store.select([item.id]);
      startEditing(item.id, live.nextKey(), false);
    },
    [store, startEditing, live, slots],
  );

  /* ---- dragging the end of an item onto another one */

  const canConnect = useCallback(
    (from: ConnectionEnd, to: ConnectionEnd) => slots.connect?.canConnect(ctx, from, to) ?? false,
    [slots, ctx],
  );
  const onConnect = useCallback(
    (from: ConnectionEnd, to: ConnectionEnd | null, point: Point) =>
      slots.connect?.onConnect(ctx, from, to, point),
    [slots, ctx],
  );

  /* ---- what each item looks like */

  const containerKey = slots.clips.length
    ? items
        .filter((i) => slots.clips.some((c) => c.type === i.data.type))
        .map((f) => `${f.id}:${f.bounds.x},${f.bounds.y},${f.bounds.w},${f.bounds.h}`)
        .join("|")
    : "";
  const containers = useMemo(() => {
    const out = new Map<string, Item<DrawData>["bounds"]>();
    for (const part of containerKey ? containerKey.split("|") : []) {
      const [id, b] = part.split(":") as [string, string];
      const [x, y, w, h] = b.split(",").map(Number) as [number, number, number, number];
      out.set(id, { x, y, w, h });
    }
    return out;
  }, [containerKey]);
  const clipOf = useCallback(
    (item: Item<DrawData>) => {
      if (containers.size === 0) return undefined;
      for (const c of slots.clips) {
        if (item.data.type === c.type) continue;
        const ref = (item.data as unknown as Record<string, unknown>)[c.field];
        if (typeof ref === "string") return containers.get(ref);
      }
      return undefined;
    },
    [containers, slots],
  );
  const soloId = selection.size === 1 ? [...selection][0]! : null;
  const editingItem = editing ? (store.get(editing.id) as DrawItem | undefined) : undefined;
  const editingValue =
    editingItem && "text" in editingItem.data
      ? ((editingItem.data as { text?: string }).text ?? "")
      : "";

  // The words the DOM shows over the GPU drawing are cut where an opaque box lies above them (a
  // sticky note over another): asked for each item the DOM holds, again when the items change.
  const aboveOf = useCallback(
    (item: DrawItem): DrawItem["bounds"][] | undefined => {
      void items;
      // A container's words are in its strip (a frame's name): what lies over the rest is its
      // content, not a cover.
      const b = item.bounds;
      const contains = slots.clips.some((c) => c.type === item.data.type);
      const words = contains ? { ...b, h: Math.min(b.h, CONTAINER_STRIP) } : b;
      let boxes: DrawItem["bounds"][] | undefined;
      for (const id of store.query({ type: "in-rect", rect: words })) {
        const other = store.get(id) as DrawItem | undefined;
        if (!other || other.z <= item.z) continue;
        if (registry.kind(other.kind)?.opaque?.(other)) (boxes ??= []).push(other.bounds);
      }
      return boxes;
    },
    [store, items, slots, registry],
  );

  const renderItem = useCallback(
    (item: Item<DrawData>, { far }: { far: boolean }) => {
      const frame = clipOf(item);
      const gpu = !!registry.kind(item.kind)?.gpu;
      const above = gpu && !far ? aboveOf(item as DrawItem) : undefined;
      const options: ItemViewOptions = {
        idPrefix: prefix,
        ...(frame ? { frame } : {}),
        ...(editing?.id === item.id
          ? { editing: { value: editingValue, onChange: typeText, onDone: finishEditing } }
          : {}),
        solo: soloId === item.id,
        far,
        ...(gpu ? { overlay: true } : {}),
        ...(above ? { above } : {}),
      };
      return <DrawItemView item={item as DrawItem} options={options} slots={slots} />;
    },
    [
      clipOf,
      prefix,
      editing,
      editingValue,
      typeText,
      finishEditing,
      soloId,
      slots,
      registry,
      aboveOf,
    ],
  );

  // Every kind that has a GPU drawing is on the GPU at every zoom (`KindSpec.gpu`), its words
  // included; a kind without one is drawn in the DOM by its paint. The DOM holds the item being
  // typed (its field: the GPU leaves its words out), the selected item that keeps its DOM (an
  // arrow's ends), and what a third-party kind shows over its drawing (`KindView.overlay`).
  const gpuKinds = useMemo(() => {
    void textVersion;
    const kinds: Record<string, FarDraw<DrawData>> = {};
    for (const id of registry.kindIds) {
      const spec = registry.kind(id);
      if (!spec?.gpu) continue;
      kinds[id] = (item, { kept }) =>
        spec.gpu!(item as DrawItem, clipOf(item), kept ? { words: false } : undefined);
    }
    return kinds;
  }, [registry, clipOf, textVersion]);
  const overlay = useCallback(
    (item: Item<DrawData>) => slots.kinds.get(item.kind)?.overlay?.(item as DrawItem) ?? false,
    [slots],
  );
  const keep = useMemo(() => {
    const solo = soloId ? (store.get(soloId) as DrawItem | undefined) : undefined;
    return [
      ...(editing ? [editing.id] : []),
      ...(solo && slots.kinds.get(solo.kind)?.keepWhenSolo ? [solo.id] : []),
    ];
  }, [editing, soloId, store, slots]);

  /* ---- keys, drops */

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    for (const key of slots.keys) {
      if (key.capture) continue;
      const combos = typeof key.combo === "string" ? [key.combo] : key.combo;
      if (combos.some((c) => matchShortcut(e.nativeEvent, c))) key.run(ctx, e);
    }
  };

  const onKeyDownCapture = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    for (const key of slots.keys) {
      if (!key.capture) continue;
      const combos = typeof key.combo === "string" ? [key.combo] : key.combo;
      if (combos.some((c) => matchShortcut(e.nativeEvent, c))) key.run(ctx, e);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (slots.drops.length === 0) return;
    const files = [...(e.dataTransfer?.files ?? [])];
    const take = files.filter((f) => slots.drops.some((d) => d.accept(f)));
    if (!take.length) return;
    e.preventDefault();
    const surface = rootOf()?.querySelector(".fg-canvas")?.getBoundingClientRect();
    const at = surface
      ? screenToWorld(store.getState().viewport, {
          x: e.clientX - surface.left,
          y: e.clientY - surface.top,
        })
      : undefined;
    take.forEach((f, i) => {
      const where = at ? { x: at.x + i * 24, y: at.y + i * 24 } : undefined;
      slots.drops.find((d) => d.accept(f))?.add(ctx, f, where);
    });
  };

  const ui = (placement: "before-zoom" | "after-zoom") =>
    slots.ui
      .filter((u) => (u.placement ?? "before-zoom") === placement)
      .map((u) => (
        <UiSlot
          key={u.id}
          Component={u.Component}
          ctx={ctx}
          slots={slots}
          style={style}
          onStyle={setStyle}
        />
      ));

  return (
    <div
      ref={rootRef}
      className={["fgd-editor", className].filter(Boolean).join(" ")}
      style={css}
      onKeyDown={onKeyDown}
      onKeyDownCapture={onKeyDownCapture}
      onDragOver={(e) => {
        if (slots.drops.length && [...(e.dataTransfer?.items ?? [])].some((i) => i.kind === "file"))
          e.preventDefault();
      }}
      onDrop={onDrop}
    >
      <Canvas
        store={store}
        label={label}
        tools={slots.tools}
        renderItem={renderItem}
        far={{ zoom: FAR_ZOOM, kinds: gpuKinds, keep, overlay }}
        itemLabel={(item) => drawItemLabel(item, registry)}
        itemRole={(item) => registry.kind(item.kind)?.label.toLowerCase() ?? item.kind}
        onItemActivate={onActivate}
        onSurfaceDoubleClick={(point) => {
          for (const fn of slots.doubleClick) if (fn(ctx, point)) return;
        }}
        onConnect={onConnect}
        canConnect={canConnect}
        layers={{
          above: (
            <>
              {slots.overlays.map((o) => (
                <o.Component key={o.id} ctx={ctx} />
              ))}
            </>
          ),
        }}
        className="fgd-canvas"
      >
        {ui("before-zoom")}
        <ZoomControls history tools={false} />
        {ui("after-zoom")}
      </Canvas>
    </div>
  );
}
