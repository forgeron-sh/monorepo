// <DrawEditor>: the whiteboard. The canvas with the draw kinds and tools, the tool dock and the
// properties panel of @forgeron/ui, the zoom controls and the minimap of canvas, text typed in
// place, images from a file or a drop, exports and the JSON clipboard.

import { screenToWorld, type ConnectionEnd, type Item, type Point } from "@forgeron/canvas";
import {
  Canvas,
  Minimap,
  useCanvasState,
  useConnection,
  WorldSvg,
  ZoomControls,
} from "@forgeron/canvas/react";
import {
  ArrowUpRight01Icon,
  Cursor01Icon,
  DiamondIcon,
  EllipseIcon,
  EraserIcon,
  FrameIcon,
  HandGrabIcon,
  Image01Icon,
  PencilIcon,
  Square01Icon,
  StickyNote01Icon,
  TextIcon,
} from "@forgeron/icons";
import { CanvasToolbar, matchShortcut, ToolbarButton, type EditorTool } from "@forgeron/ui";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { group, newGroupId, toggleLock, ungroup } from "../core/arrange";
import { arrowEnds, canBind, layoutArrowFrom } from "../core/arrows";
import { DEFAULT_STYLE, imageBounds, imageItem, type DrawStyle } from "../core/create";
import { serializeBoard } from "../core/document";
import type { DrawStore } from "../core/engine";
import { pagePaint, paintItem } from "../core/paint";
import { penFromPoints } from "../core/pen";
import { stickyHeight, textHeight, textWidth } from "../core/text";
import type { ArrowData, DrawData, DrawItem } from "../core/types";
import { download, exportSvgDocument, fileName, svgToPng } from "./export";
import { Inspector } from "./inspector";
import { DrawItemView, FAR_ZOOM, toReact } from "./render";
import { createSession, createSignal, useSignal, type Signal } from "./signal";
import { createTools } from "./tools";

const DOCK: EditorTool[] = [
  { id: "select", label: "Select", icon: Cursor01Icon, shortcut: "v", group: "pick" },
  { id: "pan", label: "Hand", icon: HandGrabIcon, shortcut: "h", group: "pick" },
  { id: "rectangle", label: "Rectangle", icon: Square01Icon, shortcut: "r", group: "shape" },
  { id: "ellipse", label: "Ellipse", icon: EllipseIcon, shortcut: "o", group: "shape" },
  { id: "diamond", label: "Diamond", icon: DiamondIcon, shortcut: "d", group: "shape" },
  { id: "sticky", label: "Sticky note", icon: StickyNote01Icon, shortcut: "s", group: "note" },
  { id: "text", label: "Text", icon: TextIcon, shortcut: "t", group: "note" },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight01Icon, shortcut: "a", group: "line" },
  { id: "pen", label: "Pixel pen", icon: PencilIcon, shortcut: "p", group: "line" },
  { id: "eraser", label: "Eraser", icon: EraserIcon, shortcut: "e", group: "line" },
  { id: "frame", label: "Frame", icon: FrameIcon, shortcut: "f", group: "frame" },
];

const KIND_LABEL: Record<string, string> = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  diamond: "Diamond",
  sticky: "Sticky note",
  text: "Text",
  arrow: "Arrow",
  pen: "Pen stroke",
  frame: "Frame",
  image: "Image",
};

/** Names an item for assistive technology: its kind and its words. */
export function drawItemLabel(item: Item<DrawData>): string {
  const d = item.data;
  const kind = KIND_LABEL[item.kind] ?? item.kind;
  const words =
    d.type === "sticky" || d.type === "text"
      ? d.text
      : d.type === "shape"
        ? (d.text ?? "")
        : d.type === "frame"
          ? d.name
          : d.type === "image"
            ? d.name
            : "";
  return words ? `${kind}: ${words.slice(0, 80)}` : kind;
}

interface Editing {
  id: string;
  key: string;
  /** A new text: its width follows what is typed. */
  grow: boolean;
}

function PenPreview({
  points,
  style,
}: {
  points: Signal<ReadonlyArray<Point> | null>;
  style: () => DrawStyle;
}) {
  const pts = useSignal(points);
  if (!pts || pts.length === 0) return null;
  const s = style();
  const g = penFromPoints(pts, { color: s.penColor, weight: s.penWeight, epsilon: 0 });
  if (!g) return null;
  const nodes = paintItem({ id: "pen-preview", kind: "pen", z: 0, ...g }, pagePaint("fgd-preview"));
  return <WorldSvg className="fgd-preview">{toReact(nodes)}</WorldSvg>;
}

function Highlights({
  store,
  ids,
  target,
}: {
  store: DrawStore;
  ids: Signal<ReadonlyArray<string>>;
  target: Signal<string | null>;
}) {
  const erasing = useSignal(ids);
  const bind = useSignal(target);
  const connection = useConnection();
  const over = bind ?? connection?.over?.itemId ?? null;
  const rects = [
    ...erasing.map((id) => ({ id, kind: "erase" as const })),
    ...(over ? [{ id: over, kind: "bind" as const }] : []),
  ];
  // An arrow end being dragged: a dashed line from the other end to the pointer.
  let wire: { from: Point; to: Point } | null = null;
  if (connection) {
    const arrow = store.get(connection.from.itemId) as DrawItem | undefined;
    if (arrow?.data.type === "arrow") {
      const ends = arrowEnds(arrow as DrawItem<ArrowData>);
      wire = {
        from: connection.from.handle === "start" ? ends.end : ends.start,
        to: connection.point,
      };
    }
  }
  if (rects.length === 0 && !wire) return null;
  return (
    <WorldSvg className="fgd-highlights">
      {rects.map(({ id, kind }) => {
        const item = store.get(id);
        if (!item) return null;
        const b = item.bounds;
        return (
          <rect
            key={`${kind}-${id}`}
            className={kind === "erase" ? "fgd-erasing" : "fgd-bind"}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {wire ? (
        <line
          className="fgd-wire"
          x1={wire.from.x}
          y1={wire.from.y}
          x2={wire.to.x}
          y2={wire.to.y}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </WorldSvg>
  );
}

export interface DrawEditorProps {
  store: DrawStore;
  /** Names the board for assistive technology. */
  label?: string;
  /** Shows the properties panel. Default `true`. */
  inspector?: boolean;
  /** Shows the minimap. Default `true`. */
  minimap?: boolean;
  /** The style of new items at first. */
  defaultStyle?: Partial<DrawStyle>;
  className?: string;
  style?: CSSProperties;
}

export function DrawEditor({
  store,
  label = "Whiteboard",
  inspector = true,
  minimap = true,
  defaultStyle,
  className,
  style: css,
}: DrawEditorProps) {
  const prefix = `fgd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [style, setStyleState] = useState<DrawStyle>(() => ({
    ...DEFAULT_STYLE,
    ...defaultStyle,
  }));
  const [editing, setEditing] = useState<Editing | null>(null);
  // What the tools and the handlers read when they run, outside of rendering: the last style,
  // the text being typed, the counter of merge keys.
  const [live] = useState(() => createSession<DrawStyle, Editing>(style));
  const [signals] = useState(() => ({
    pen: createSignal<ReadonlyArray<Point> | null>(null),
    erasing: createSignal<ReadonlyArray<string>>([]),
    target: createSignal<string | null>(null),
  }));
  const setStyle = useCallback(
    (next: DrawStyle) => {
      live.setStyle(next);
      setStyleState(next);
    },
    [live],
  );

  const tool = useCanvasState(store, (s) => s.tool);
  const items = useCanvasState(store, (s) => s.items) as ReadonlyArray<DrawItem>;
  const selection = useCanvasState(store, (s) => s.selection);
  const far = useCanvasState(store, (s) => s.viewport.zoom < FAR_ZOOM);

  const startEditing = useCallback(
    (id: string, key: string, grow: boolean) => {
      const next = { id, key, grow };
      live.setEditing(next);
      setEditing(next);
    },
    [live],
  );

  const tools = useMemo(
    () =>
      createTools({
        style: () => live.style(),
        edit: startEditing,
        editKey: () => live.nextKey(),
        pen: signals.pen,
        erasing: signals.erasing,
        target: signals.target,
        frameName: () =>
          `Frame ${store.getState().items.filter((i) => i.kind === "frame").length + 1}`,
      }),
    [store, signals, startEditing, live],
  );

  /* ---- text typed in place */

  const finishEditing = useCallback(
    (cancel: boolean) => {
      const e = live.editing();
      if (!e) return;
      live.setEditing(null);
      setEditing(null);
      const item = store.get(e.id) as DrawItem | undefined;
      if (!item) return;
      const d = item.data;
      // An empty text is no text: it goes, merged with its add into nothing.
      if ((d.type === "text" && !d.text.trim()) || (cancel && d.type === "sticky" && !d.text)) {
        store.remove([e.id], { coalesce: e.key });
      }
      rootRef.current?.querySelector<HTMLElement>(".fg-canvas")?.focus({ preventScroll: true });
    },
    [store, live],
  );

  const typeText = useCallback(
    (text: string, measured: number | null) => {
      const e = live.editing();
      const item = e ? (store.get(e.id) as DrawItem | undefined) : undefined;
      if (!e || !item) return;
      const d = item.data;
      const b = item.bounds;
      let change: Partial<Item<DrawData>> | null = null;
      if (d.type === "sticky") {
        const h = Math.max(b.w, measured ?? stickyHeight(text, b.w));
        change = { data: { ...d, text }, bounds: { ...b, h: Math.max(stickyHeight("", b.w), h) } };
      } else if (d.type === "text") {
        const w = e.grow ? Math.min(640, Math.max(d.size * 4, textWidth(text, d.size) + 8)) : b.w;
        const h = Math.max(measured ?? 0, textHeight(text || " ", w, d.size));
        change = { data: { ...d, text }, bounds: { ...b, w, h } };
      } else if (d.type === "shape") {
        change = { data: { ...d, text } };
      }
      if (change) store.update(e.id, change, { label: "Type", coalesce: e.key });
    },
    [store, live],
  );

  const onActivate = useCallback(
    (item: Item<DrawData>) => {
      if (item.locked) return;
      const t = item.data.type;
      if (t === "sticky" || t === "text" || t === "shape") {
        store.select([item.id]);
        startEditing(item.id, live.nextKey(), false);
      }
    },
    [store, startEditing, live],
  );

  /* ---- arrows: dragging an end onto an item */

  const canConnect = useCallback(
    (from: ConnectionEnd, to: ConnectionEnd) => {
      const arrow = store.get(from.itemId);
      return (
        arrow?.data.type === "arrow" &&
        to.itemId !== from.itemId &&
        canBind(store.get(to.itemId) as DrawItem)
      );
    },
    [store],
  );
  const onConnect = useCallback(
    (from: ConnectionEnd, to: ConnectionEnd | null, point: Point) => {
      const arrow = store.get(from.itemId) as DrawItem<ArrowData> | undefined;
      if (
        !arrow ||
        arrow.data.type !== "arrow" ||
        (from.handle !== "start" && from.handle !== "end")
      )
        return;
      const ends = arrowEnds(arrow);
      const which = from.handle;
      const { bind: _b, ...free } = arrow.data[which];
      const data: ArrowData = { ...arrow.data, [which]: to ? { ...free, bind: to.itemId } : free };
      const g = layoutArrowFrom(
        data,
        which === "start" ? point : ends.start,
        which === "end" ? point : ends.end,
        (id) => store.get(id) as DrawItem | undefined,
      );
      store.update(arrow.id, { bounds: g.bounds, data: g.data }, { label: "Move arrow end" });
    },
    [store],
  );

  /* ---- what each item looks like */

  const frameKey = items
    .filter((i) => i.data.type === "frame")
    .map((f) => `${f.id}:${f.bounds.x},${f.bounds.y},${f.bounds.w},${f.bounds.h}`)
    .join("|");
  const frames = useMemo(() => {
    const out = new Map<string, Item<DrawData>["bounds"]>();
    for (const part of frameKey ? frameKey.split("|") : []) {
      const [id, b] = part.split(":") as [string, string];
      const [x, y, w, h] = b.split(",").map(Number) as [number, number, number, number];
      out.set(id, { x, y, w, h });
    }
    return out;
  }, [frameKey]);
  const singleArrow =
    selection.size === 1
      ? store.get([...selection][0]!)?.data.type === "arrow"
        ? [...selection][0]!
        : null
      : null;
  const editingText = editing ? (store.get(editing.id) as DrawItem | undefined) : undefined;
  const editingValue =
    editingText && "text" in editingText.data ? (editingText.data.text ?? "") : "";

  const renderItem = useCallback(
    (item: Item<DrawData>) => {
      const d = item.data;
      const frame = d.type !== "frame" && d.frame ? frames.get(d.frame) : undefined;
      return (
        <DrawItemView
          item={item as DrawItem}
          options={{
            idPrefix: prefix,
            ...(frame ? { frame } : {}),
            ...(editing?.id === item.id
              ? { editing: { value: editingValue, onChange: typeText, onDone: finishEditing } }
              : {}),
            showEnds: singleArrow === item.id,
            far,
          }}
        />
      );
    },
    [frames, prefix, editing, editingValue, typeText, finishEditing, singleArrow, far],
  );

  /* ---- images, exports, the JSON clipboard */

  const addImage = useCallback(
    (file: File, at?: Point) => {
      if (!file.type.startsWith("image/")) return;
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = store.getState();
        const where =
          at ??
          screenToWorld(s.viewport, {
            x: s.size.w / 2 - Math.min(img.naturalWidth, 480) / 2,
            y: s.size.h / 2 - 120,
          });
        const [item] = store.add(
          imageItem(
            imageBounds(where, img.naturalWidth || 320, img.naturalHeight || 240),
            src,
            file.name,
          ),
          {
            label: "Add image",
          },
        );
        if (item) store.select([item.id]);
      };
      img.onerror = () => URL.revokeObjectURL(src);
      img.src = src;
    },
    [store],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    const surface = rootRef.current?.querySelector(".fg-canvas")?.getBoundingClientRect();
    const at = surface
      ? screenToWorld(store.getState().viewport, {
          x: e.clientX - surface.left,
          y: e.clientY - surface.top,
        })
      : undefined;
    files.forEach((f, i) => addImage(f, at ? { x: at.x + i * 24, y: at.y + i * 24 } : undefined));
  };

  const exportIds = useCallback(
    async (format: "png" | "svg", ids: string[]) => {
      const all = store.getState().items as DrawItem[];
      const result = await exportSvgDocument(all, { ids, from: rootRef.current });
      if (!result) return;
      const lone = ids.length === 1 ? store.get(ids[0]!) : undefined;
      const name = lone?.data.type === "frame" ? lone.data.name : "selection";
      if (format === "svg") download(result.svg, fileName(name, "svg"));
      else download(await svgToPng(result), fileName(name, "png"));
    },
    [store],
  );

  const copyJson = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      const json = serializeBoard(
        (store.getState().items as DrawItem[]).filter((i) => set.has(i.id)),
      );
      void navigator.clipboard?.writeText(json).catch(() => undefined);
    },
    [store],
  );

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    const sel = () => store.selectedItems() as DrawItem[];
    const all = () => store.getState().items as DrawItem[];
    if (matchShortcut(e.nativeEvent, "mod+g")) {
      e.preventDefault();
      const changes = group(sel(), newGroupId(all()));
      if (changes.length) store.updateMany(changes, { label: "Group" });
    } else if (matchShortcut(e.nativeEvent, "mod+shift+g")) {
      e.preventDefault();
      const changes = ungroup(sel());
      if (changes.length) store.updateMany(changes, { label: "Ungroup" });
    } else if (matchShortcut(e.nativeEvent, "mod+shift+l")) {
      e.preventDefault();
      const changes = toggleLock(sel());
      if (changes.length) store.updateMany(changes, { label: "Lock" });
    } else if (matchShortcut(e.nativeEvent, "mod+shift+e")) {
      e.preventDefault();
      const ids = sel().map((i) => i.id);
      if (ids.length) void exportIds("png", ids);
    } else if (matchShortcut(e.nativeEvent, "mod+c") || matchShortcut(e.nativeEvent, "mod+x")) {
      // The canvas copies for its own paste; the system clipboard gets the board's JSON too.
      const ids = sel().map((i) => i.id);
      if (ids.length) copyJson(ids);
    }
  };

  const onKeyDownCapture = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!matchShortcut(e.nativeEvent, "mod+v")) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    const read =
      typeof navigator !== "undefined"
        ? navigator.clipboard?.readText?.bind(navigator.clipboard)
        : undefined;
    if (!read) return;
    // JSON on the system clipboard (from another board, another tab) is pasted; else the canvas's own.
    e.preventDefault();
    e.stopPropagation();
    read()
      .then((text) => {
        if (/^\s*\{/.test(text) && /"items"/.test(text)) store.paste(text);
        else store.paste();
      })
      .catch(() => store.paste());
  };

  const dockValue = DOCK.some((t) => t.id === tool) ? tool : "select";

  return (
    <div
      ref={rootRef}
      className={["fgd-editor", className].filter(Boolean).join(" ")}
      style={css}
      onKeyDown={onKeyDown}
      onKeyDownCapture={onKeyDownCapture}
      onDragOver={(e) => {
        if ([...(e.dataTransfer?.items ?? [])].some((i) => i.kind === "file")) e.preventDefault();
      }}
      onDrop={onDrop}
    >
      <Canvas
        store={store}
        label={label}
        tools={tools}
        renderItem={renderItem}
        itemLabel={drawItemLabel}
        onItemActivate={onActivate}
        onSurfaceDoubleClick={(point) => {
          const key = live.nextKey();
          const s = live.style();
          const [item] = store.add(
            {
              kind: "text",
              bounds: {
                x: point.x,
                y: point.y - s.textSize * 0.7,
                w: s.textSize * 4,
                h: textHeight(" ", 80, s.textSize),
              },
              data: { type: "text", text: "", size: s.textSize, color: s.textColor, align: "left" },
            },
            { label: "Add text", coalesce: key },
          );
          if (item) {
            store.select([item.id]);
            startEditing(item.id, key, true);
          }
        }}
        onConnect={onConnect}
        canConnect={canConnect}
        layers={{
          above: (
            <>
              <PenPreview points={signals.pen} style={() => live.style()} />
              <Highlights store={store} ids={signals.erasing} target={signals.target} />
            </>
          ),
        }}
        className="fgd-canvas"
      >
        <div className="fgd-dock">
          <CanvasToolbar
            label="Drawing tools"
            tools={DOCK}
            value={dockValue}
            onChange={(id) => store.setTool(id)}
            shortcuts={false}
            floating
          >
            <ToolbarButton
              label="Image"
              icon={Image01Icon}
              className="fg-edt-tool"
              onClick={() => fileRef.current?.click()}
            />
          </CanvasToolbar>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) addImage(f);
              e.currentTarget.value = "";
            }}
          />
        </div>
        {inspector ? (
          <Inspector
            store={store}
            style={style}
            onStyle={setStyle}
            onExport={exportIds}
            onCopyJson={copyJson}
          />
        ) : null}
        <ZoomControls history tools={false} />
        {minimap ? (
          <Minimap
            colorOf={(item) =>
              item.data && (item.data as DrawData).type === "frame" ? "--line-strong" : undefined
            }
          />
        ) : null}
      </Canvas>
    </div>
  );
}
