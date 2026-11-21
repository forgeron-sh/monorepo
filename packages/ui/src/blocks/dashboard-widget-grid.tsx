// A dashboard grid: widgets on 12 columns, placed by a layout that is plain data (so it can be
// saved). In edit mode a widget is dragged by its body, resized by its corner, or moved with the
// arrows (Shift resizes); a widget it lands on is pushed down and the rest fall back up. Under a
// narrow width the grid is one column, in reading order.
//
// Without children it draws the edit bar, the grid and the live region. With them they are the
// parts; the widgets and the layout stay in the root, which owns the drag:
//
//   <WidgetGrid widgets={widgets} layout={layout} onLayoutChange={save} editing={editing}>
//     <WidgetGridEditBar />
//     <WidgetGridCanvas>
//       {(widget) => (
//         <WidgetGridItem id={widget.id}>
//           <WidgetGridContent />
//           <WidgetGridGrab /><WidgetGridResize /><WidgetGridRemove />
//         </WidgetGridItem>
//       )}
//     </WidgetGridCanvas>
//     <WidgetGridStatus />
//   </WidgetGrid>

import { Cancel01Icon, CursorMove02Icon, PlusSignIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useWidth } from "../charts/scale";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { renderPart } from "../part";
import {
  DASHBOARD_COLUMNS,
  dashboardBoxText,
  dashboardDragBox,
  dashboardKeyBox,
  dashboardPlace,
  dashboardRows,
  dashboardSameLayout,
  dashboardStackOrder,
  dashboardSync,
  type WidgetLayout,
  type WidgetLimits,
} from "./dashboard-model";

export type { WidgetLayout } from "./dashboard-model";

export interface DashboardWidget extends WidgetLimits {
  /** Identifies the widget in the layout. */
  id: string;
  /** Names the widget in the edit controls: `Revenue by month`. */
  label: string;
  /** What it shows: usually a `WidgetFrame`. */
  content: ReactNode;
  /** Cannot be moved, resized or removed. */
  locked?: boolean;
}

export interface WidgetGridProps extends Omit<ComponentProps<"div">, "className"> {
  widgets: ReadonlyArray<DashboardWidget>;
  /** Where each widget sits; widgets without a place take the first free slot. */
  layout?: ReadonlyArray<WidgetLayout>;
  defaultLayout?: ReadonlyArray<WidgetLayout>;
  /** Hears the layout after every move, resize, removal or arrival. */
  onLayoutChange?: (layout: WidgetLayout[]) => void;
  /** Edit mode: widgets can be moved, resized and removed. */
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  /** Columns. Default 12. */
  columns?: number;
  /** Height of a row in px. Default 96. */
  rowHeight?: number;
  /** Space between cells in px. Default 12. */
  gap?: number;
  /** Under this width in px the grid is a single column. Default 640. */
  collapseBelow?: number;
  /** Shows a remove button on each widget in edit mode. */
  onRemoveWidget?: (id: string) => void;
  /** Shows an add button above the grid in edit mode. */
  onAddWidget?: () => void;
  addLabel?: string;
  /** Names the region for assistive technology. Default `Dashboard`. */
  label?: string;
  /** Shown when there is no widget. */
  empty?: ReactNode;
  className?: string;
  asChild?: boolean;
  /** The parts. Without them: the edit bar, the grid and the live region. */
  children?: ReactNode;
}

interface Drag {
  id: string;
  mode: "move" | "resize";
  from: WidgetLayout;
  x: number;
  y: number;
  colW: number;
}

interface WidgetGridContext {
  widgets: ReadonlyArray<DashboardWidget>;
  byId: ReadonlyMap<string, DashboardWidget>;
  /** Where each widget is drawn now: the layout, or the preview of a drag. */
  placeOf: ReadonlyMap<string, WidgetLayout>;
  /** The ids in reading order, the order of a stacked grid. */
  order: ReadonlyArray<string>;
  /** The rows the layout takes. */
  rows: number;
  editing: boolean;
  stacked: boolean;
  columns: number;
  rowHeight: number;
  gap: number;
  box: RefObject<HTMLDivElement | null>;
  hintId: string;
  said: string;
  addLabel: string;
  empty: ReactNode;
  onAddWidget: (() => void) | undefined;
  onRemoveWidget: ((id: string) => void) | undefined;
  /** Whether this widget is being dragged now. */
  isDragging: (id: string) => boolean;
  begin: (event: PointerEvent<HTMLElement>, id: string, mode: Drag["mode"]) => void;
  move: (event: PointerEvent<HTMLElement>) => void;
  end: (event: PointerEvent<HTMLElement>) => void;
  cancel: () => void;
  keys: (event: KeyboardEvent<HTMLElement>, id: string) => void;
  remove: (id: string) => void;
}

const Ctx = createContext<WidgetGridContext | null>(null);

/** The grid a part is in: the widgets, where they are, and the drag. */
export function useWidgetGrid(part = "useWidgetGrid"): WidgetGridContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <WidgetGrid>.`);
  return ctx;
}

interface ItemContext {
  widget: DashboardWidget;
  place: WidgetLayout;
  /** In edit mode and not locked. */
  editable: boolean;
  dragging: boolean;
}

const ItemCtx = createContext<ItemContext | null>(null);

function useItem(part: string): ItemContext {
  const ctx = useContext(ItemCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <WidgetGridItem>.`);
  return ctx;
}

/**
 * The grid of a dashboard. Controlled (`layout` + `onLayoutChange`) or not (`defaultLayout`);
 * the layout is `{ id, x, y, w, h }` per widget, in cells. Edit mode is `editing`.
 */
export function WidgetGrid({
  widgets,
  layout: layoutProp,
  defaultLayout = [],
  onLayoutChange,
  editing: editingProp,
  defaultEditing = false,
  onEditingChange,
  columns = DASHBOARD_COLUMNS,
  rowHeight = 96,
  gap = 12,
  collapseBelow = 640,
  onRemoveWidget,
  onAddWidget,
  addLabel = "Add widget",
  label = "Dashboard",
  empty,
  className,
  asChild,
  children,
  ...rest
}: WidgetGridProps) {
  const hintId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [box, width] = useWidth<HTMLDivElement>(1200);
  const [stored, setStored] = useControllableState<ReadonlyArray<WidgetLayout>>({
    value: layoutProp,
    defaultValue: defaultLayout,
    onChange: onLayoutChange ? (next) => onLayoutChange([...next]) : undefined,
  });
  const [editing] = useControllableState({
    value: editingProp,
    defaultValue: defaultEditing,
    onChange: onEditingChange,
  });
  const [preview, setPreview] = useState<WidgetLayout[] | null>(null);
  const [said, setSaid] = useState("");
  const drag = useRef<Drag | null>(null);

  const ids = widgets.map((w) => w.id);
  const limits = useMemo(
    () =>
      Object.fromEntries(
        widgets.map((w) => [w.id, { minW: w.minW, minH: w.minH, maxW: w.maxW, maxH: w.maxH }]),
      ) as Record<string, WidgetLimits>,
    [widgets],
  );
  const fitted = useMemo(
    () => dashboardSync(stored, ids, { columns, limits }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stored, ids.join("\u0000"), columns, limits],
  );
  // New widgets arrive with a place, so a saved layout always lists every widget.
  const settled = dashboardSameLayout(fitted, stored);
  useEffect(() => {
    if (!settled) setStored(fitted);
  }, [settled, fitted, setStored]);

  const display = preview ?? fitted;
  const stacked = width < collapseBelow;
  const byId = new Map(widgets.map((w) => [w.id, w]));

  const commit = (next: WidgetLayout[]) => {
    setStored(next);
    setPreview(null);
  };
  const announce = (id: string, next: ReadonlyArray<WidgetLayout>) => {
    const at = next.find((p) => p.id === id);
    if (at) setSaid(`${byId.get(id)?.label ?? id}: ${dashboardBoxText(at)}`);
  };

  const begin = (event: PointerEvent<HTMLElement>, id: string, mode: Drag["mode"]) => {
    const from = fitted.find((p) => p.id === id);
    const frame = box.current?.getBoundingClientRect();
    if (!editing || stacked || !from || !frame || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = {
      id,
      mode,
      from,
      x: event.clientX,
      y: event.clientY,
      colW: (frame.width - gap * (columns - 1)) / columns,
    };
  };
  const move = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const next = dashboardPlace(
      fitted,
      d.id,
      dashboardDragBox(
        d.from,
        event.clientX - d.x,
        event.clientY - d.y,
        { colW: d.colW, rowH: rowHeight, gap },
        d.mode,
      ),
      { columns, limits: limits[d.id] ?? {} },
    );
    setPreview((now) => (now && dashboardSameLayout(now, next) ? now : next));
  };
  const end = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (preview) {
      announce(d.id, preview);
      commit(preview);
    } else setPreview(null);
  };
  const cancel = () => {
    drag.current = null;
    setPreview(null);
  };
  const remove = (id: string) => {
    onRemoveWidget?.(id);
    root.current?.focus();
  };

  const keys = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Escape" && drag.current) {
      cancel();
      event.preventDefault();
      return;
    }
    if (event.key === "Delete" && onRemoveWidget) {
      event.preventDefault();
      remove(id);
      return;
    }
    const at = fitted.find((p) => p.id === id);
    const next = at ? dashboardKeyBox(at, event.key, event.shiftKey) : null;
    if (!at || !next) return;
    event.preventDefault();
    const placed = dashboardPlace(fitted, id, next, { columns, limits: limits[id] ?? {} });
    if (dashboardSameLayout(placed, fitted)) return;
    setStored(placed);
    announce(id, placed);
  };

  const ctx: WidgetGridContext = {
    widgets,
    byId,
    placeOf: new Map(display.map((p) => [p.id, p])),
    order: dashboardStackOrder(display),
    rows: Math.max(1, dashboardRows(display)),
    editing,
    stacked,
    columns,
    rowHeight,
    gap,
    box,
    hintId,
    said,
    addLabel,
    empty,
    onAddWidget,
    onRemoveWidget,
    isDragging: (id) => preview !== null && drag.current?.id === id,
    begin,
    move,
    end,
    cancel,
    keys,
    remove,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart("div", cx("fg-dash-gridwrap", editing && "fg-dash-editing", className), asChild, {
        "data-slot": "widget-grid",
        ref: root,
        tabIndex: -1,
        role: "region",
        "aria-label": label,
        ...rest,
        children: children ?? (
          <>
            <WidgetGridEditBar />
            <WidgetGridCanvas />
            <WidgetGridStatus />
          </>
        ),
      })}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** In edit mode: what the pointer and the keys do, and the add button. */
export function WidgetGridEditBar({ className, children, ...rest }: ComponentProps<"div">) {
  const { editing, widgets, onAddWidget, stacked, hintId, addLabel } =
    useWidgetGrid("WidgetGridEditBar");
  if (!editing || !(onAddWidget || widgets.length > 0)) return null;
  return (
    <div data-slot="widget-grid-edit-bar" {...rest} className={cx("fg-dash-editbar", className)}>
      {children ?? (
        <>
          <span id={hintId} className="fg-dash-edithint">
            {stacked
              ? "Arrow keys move a widget, Delete removes it."
              : "Drag a widget to move it, its corner to resize it. Arrows move, Shift and arrows resize."}
          </span>
          {onAddWidget ? (
            <Button size="sm" onClick={onAddWidget}>
              <Icon icon={PlusSignIcon} size={12} variant="mono" />
              {addLabel}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

export interface WidgetGridCanvasProps extends Omit<ComponentProps<"div">, "children"> {
  /** Draws one widget, as a `WidgetGridItem`. Default: every widget with its content and edit controls. */
  children?: (widget: DashboardWidget, place: WidgetLayout) => ReactNode;
}

/** The 12-column grid itself, or the `empty` note when there is no widget. */
export function WidgetGridCanvas({ className, style, children, ...rest }: WidgetGridCanvasProps) {
  const { widgets, byId, placeOf, order, rows, columns, rowHeight, gap, stacked, box, empty } =
    useWidgetGrid("WidgetGridCanvas");
  if (widgets.length === 0)
    return <div className="fg-dash-gridempty">{empty ?? "No widgets yet"}</div>;
  return (
    <div
      ref={box}
      data-slot="widget-grid-canvas"
      {...rest}
      className={cx("fg-dash-grid", stacked && "fg-dash-grid-stack", className)}
      style={
        {
          "--fg-dash-cols": columns,
          "--fg-dash-row": `${rowHeight}px`,
          "--fg-dash-gap": `${gap}px`,
          "--fg-dash-rows": rows,
          ...style,
        } as CSSProperties
      }
    >
      {order.map((id) => {
        const widget = byId.get(id);
        const place = placeOf.get(id);
        if (!widget || !place) return null;
        return children ? (
          <WidgetGridItem key={id} id={id}>
            {children(widget, place)}
          </WidgetGridItem>
        ) : (
          <WidgetGridItem key={id} id={id} />
        );
      })}
    </div>
  );
}

export interface WidgetGridItemProps extends Omit<ComponentProps<"div">, "id"> {
  /** The id of the widget. */
  id: string;
  asChild?: boolean;
}

/** The cell of one widget: its place in the grid. Children are its parts; default: content and controls. */
export function WidgetGridItem({
  id,
  className,
  style,
  asChild,
  children,
  ...rest
}: WidgetGridItemProps) {
  const { byId, placeOf, editing, isDragging, onRemoveWidget } = useWidgetGrid("WidgetGridItem");
  const widget = byId.get(id);
  const place = placeOf.get(id);
  if (!widget || !place) return null;
  const editable = editing && !widget.locked;
  const dragging = isDragging(id);
  return (
    <ItemCtx.Provider value={{ widget, place, editable, dragging }}>
      {renderPart(
        "div",
        cx(
          "fg-dash-cell",
          editable && "fg-dash-cell-edit",
          dragging && "fg-dash-dragging",
          className,
        ),
        asChild,
        {
          "data-slot": "widget-grid-item",
          ...rest,
          style: { "--x": place.x, "--y": place.y, "--w": place.w, "--h": place.h, ...style },
          children: children ?? (
            <>
              <WidgetGridContent />
              <WidgetGridGrab />
              <WidgetGridResize />
              {onRemoveWidget ? <WidgetGridRemove /> : null}
            </>
          ),
        },
      )}
    </ItemCtx.Provider>
  );
}

/** What the widget shows. Not reachable by keyboard or pointer while it is being edited. */
export function WidgetGridContent({ className, children, ...rest }: ComponentProps<"div">) {
  const { widget, editable } = useItem("WidgetGridContent");
  return (
    <div
      data-slot="widget-grid-content"
      {...rest}
      className={cx("fg-dash-content", className)}
      inert={editable || undefined}
    >
      {children ?? widget.content}
    </div>
  );
}

/** The handle that moves the widget: drag it, or press the arrows (Shift resizes). Edit mode only. */
export function WidgetGridGrab({ className, children, ...rest }: ComponentProps<"button">) {
  const { widget, editable } = useItem("WidgetGridGrab");
  const { begin, move, end, cancel, keys, hintId } = useWidgetGrid("WidgetGridGrab");
  if (!editable) return null;
  return (
    <button
      type="button"
      data-slot="widget-grid-grab"
      aria-label={`Move or resize ${widget.label}`}
      aria-describedby={hintId}
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight"
      {...rest}
      className={cx("fg-dash-grab", className)}
      onPointerDown={(e) => begin(e, widget.id, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={cancel}
      onKeyDown={(e) => keys(e, widget.id)}
    >
      {children ?? (
        <span className="fg-dash-grab-tag">
          <Icon icon={CursorMove02Icon} size={12} variant="mono" />
          {widget.label}
        </span>
      )}
    </button>
  );
}

/** The corner that resizes the widget. Edit mode only, and not in a one-column grid. */
export function WidgetGridResize({ className, ...rest }: ComponentProps<"span">) {
  const { widget, editable } = useItem("WidgetGridResize");
  const { begin, move, end, cancel, stacked } = useWidgetGrid("WidgetGridResize");
  if (!editable || stacked) return null;
  return (
    <span
      data-slot="widget-grid-resize"
      aria-hidden="true"
      {...rest}
      className={cx("fg-dash-size", className)}
      onPointerDown={(e) => begin(e, widget.id, "resize")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={cancel}
    />
  );
}

/** The button that removes the widget. Edit mode only; the root's `onRemoveWidget` hears it. */
export function WidgetGridRemove({ className, children, ...rest }: ComponentProps<"button">) {
  const { widget, editable } = useItem("WidgetGridRemove");
  const { remove } = useWidgetGrid("WidgetGridRemove");
  if (!editable) return null;
  return (
    <button
      type="button"
      data-slot="widget-grid-remove"
      aria-label={`Remove ${widget.label}`}
      {...rest}
      className={cx("fg-dash-remove", className)}
      onClick={() => remove(widget.id)}
    >
      {children ?? <Icon icon={Cancel01Icon} size={12} variant="mono" />}
    </button>
  );
}

/** The live region that says where a widget landed. */
export function WidgetGridStatus({ className, children, ...rest }: ComponentProps<"div">) {
  const { said } = useWidgetGrid("WidgetGridStatus");
  return (
    <div
      data-slot="widget-grid-status"
      aria-live="polite"
      role="status"
      {...rest}
      className={cx("fg-visually-hidden", className)}
    >
      {children ?? said}
    </div>
  );
}
