// A dashboard grid: widgets on 12 columns, placed by a layout that is plain data (so it can be
// saved). In edit mode a widget is dragged by its body, resized by its corner, or moved with the
// arrows (Shift resizes); a widget it lands on is pushed down and the rest fall back up. Under a
// narrow width the grid is one column, in reading order.

import { Cancel01Icon, CursorMove02Icon, PlusSignIcon } from "@forgeron/icons";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
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
import { useWidth } from "../charts/scale";

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

export interface WidgetGridProps {
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
}

interface Drag {
  id: string;
  mode: "move" | "resize";
  from: WidgetLayout;
  x: number;
  y: number;
  colW: number;
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
}: WidgetGridProps) {
  const hint = useId();
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
  const order = dashboardStackOrder(display);
  const byId = new Map(widgets.map((w) => [w.id, w]));
  const placeOf = new Map(display.map((p) => [p.id, p]));

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

  const keys = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Escape" && drag.current) {
      drag.current = null;
      setPreview(null);
      event.preventDefault();
      return;
    }
    if (event.key === "Delete" && onRemoveWidget) {
      event.preventDefault();
      onRemoveWidget(id);
      root.current?.focus();
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

  return (
    <div
      ref={root}
      tabIndex={-1}
      role="region"
      aria-label={label}
      className={cx("fg-dash-gridwrap", editing && "fg-dash-editing", className)}
    >
      {editing && (onAddWidget || widgets.length > 0) ? (
        <div className="fg-dash-editbar">
          <span id={hint} className="fg-dash-edithint">
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
        </div>
      ) : null}
      {widgets.length === 0 ? (
        <div className="fg-dash-gridempty">{empty ?? "No widgets yet"}</div>
      ) : (
        <div
          ref={box}
          className={cx("fg-dash-grid", stacked && "fg-dash-grid-stack")}
          style={
            {
              "--fg-dash-cols": columns,
              "--fg-dash-row": `${rowHeight}px`,
              "--fg-dash-gap": `${gap}px`,
              "--fg-dash-rows": Math.max(1, dashboardRows(display)),
            } as CSSProperties
          }
        >
          {order.map((id) => {
            const widget = byId.get(id);
            const place = placeOf.get(id);
            if (!widget || !place) return null;
            const editable = editing && !widget.locked;
            const dragging = preview !== null && drag.current?.id === id;
            return (
              <div
                key={id}
                className={cx(
                  "fg-dash-cell",
                  editable && "fg-dash-cell-edit",
                  dragging && "fg-dash-dragging",
                )}
                style={
                  {
                    "--x": place.x,
                    "--y": place.y,
                    "--w": place.w,
                    "--h": place.h,
                  } as CSSProperties
                }
              >
                <div className="fg-dash-content" inert={editable || undefined}>
                  {widget.content}
                </div>
                {editable ? (
                  <>
                    <button
                      type="button"
                      className="fg-dash-grab"
                      aria-label={`Move or resize ${widget.label}`}
                      aria-describedby={hint}
                      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight"
                      onPointerDown={(e) => begin(e, id, "move")}
                      onPointerMove={move}
                      onPointerUp={end}
                      onPointerCancel={() => {
                        drag.current = null;
                        setPreview(null);
                      }}
                      onKeyDown={(e) => keys(e, id)}
                    >
                      <span className="fg-dash-grab-tag">
                        <Icon icon={CursorMove02Icon} size={12} variant="mono" />
                        {widget.label}
                      </span>
                    </button>
                    {stacked ? null : (
                      <span
                        className="fg-dash-size"
                        aria-hidden="true"
                        onPointerDown={(e) => begin(e, id, "resize")}
                        onPointerMove={move}
                        onPointerUp={end}
                        onPointerCancel={() => {
                          drag.current = null;
                          setPreview(null);
                        }}
                      />
                    )}
                    {onRemoveWidget ? (
                      <button
                        type="button"
                        className="fg-dash-remove"
                        aria-label={`Remove ${widget.label}`}
                        onClick={() => {
                          onRemoveWidget(id);
                          root.current?.focus();
                        }}
                      >
                        <Icon icon={Cancel01Icon} size={12} variant="mono" />
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div className="fg-visually-hidden" aria-live="polite" role="status">
        {said}
      </div>
    </div>
  );
}
