// `Resizable`, as in shadcn (which wraps react-resizable-panels): a group of panels and the handles
// between them. Built here with no dependency. Layout in percent by default; `unit="px"` is the
// mode `SplitPane` uses (every panel but the last in px, the last takes the rest). The handle is
// the WAI-ARIA window splitter. The panels and handles are read from the children of the group
// (through fragments), so they must be written there, not behind another component.

import type { ComponentProps, KeyboardEvent, PointerEvent, ReactElement, ReactNode } from "react";
import {
  Children,
  Fragment,
  cloneElement,
  createContext,
  isValidElement,
  use,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useControllableState } from "./hooks/use-controllable";
import {
  fitLayout,
  fitRemainder,
  initialLayout,
  isCollapsed,
  pairBounds,
  resizePair,
  sameLayout,
  toggleCollapse,
  type PanelLimits,
} from "./resizable-model";
import { renderPart, type Part } from "./part";

export type ResizableDirection = "horizontal" | "vertical";

const roles = new WeakMap<object, "panel" | "handle">();
/** Makes a component count as a panel or a handle when a group reads its children. */
export function registerResizablePart(part: object, role: "panel" | "handle"): void {
  roles.set(part, role);
}

/** The space an unmeasured group (no layout engine, not shown yet) is taken to have, in px. */
const UNMEASURED = 1_000_000;
const STORAGE_PREFIX = "fg-resizable:";

export interface ResizablePanelProps extends Omit<Part<ComponentProps<"div">>, "id"> {
  /** The first size, in percent (px in the px mode). The panels without one share what is left. */
  defaultSize?: number;
  /** The least the panel can shrink to. Default 0. */
  minSize?: number;
  /** The most the panel can grow to. Default the whole group. */
  maxSize?: number;
  /** A collapsible panel collapses (to `collapsedSize`) when dragged under its minimum, or on Enter. */
  collapsible?: boolean;
  collapsedSize?: number;
  /** Accepted as in react-resizable-panels; the order is the one of the children. */
  order?: number;
  id?: string;
  asChild?: boolean;
}

export interface ResizableHandleProps extends Part<Omit<ComponentProps<"div">, "id">> {
  /** Draws a grip in the middle. */
  withHandle?: boolean;
  disabled?: boolean;
}

export interface ResizablePanelGroupProps extends Omit<
  Part<ComponentProps<"div">>,
  "onChange" | "defaultValue"
> {
  /** `horizontal` (default): side by side, vertical handles. `vertical`: one above the other. */
  direction?: ResizableDirection;
  /** The name newer versions of the shadcn component use for `direction`. */
  orientation?: ResizableDirection;
  /** `percent` (default): layout in percent. `px`: every panel but the last in px. */
  unit?: "percent" | "px";
  /** The size of every panel, when you own it. */
  layout?: number[];
  defaultLayout?: number[];
  /** Fires on every change of the layout. */
  onLayout?: (layout: number[]) => void;
  /** Fires when a drag ends or a key is pressed: the moment to save the layout. */
  onLayoutChanged?: (layout: number[]) => void;
  /** What an arrow key moves a handle by; with Shift, four times as much. Default 5 (16 in px). */
  keyStep?: number;
  /** Keeps the layout in `localStorage` under this key, and restores it on mount (not when controlled). */
  storageKey?: string;
}

interface GroupState {
  direction: ResizableDirection;
  px: boolean;
  measured: boolean;
  layout: number[];
  limits: PanelLimits[];
  defaults: Array<number | undefined>;
  ids: string[];
  keyStep: number;
  /** Space the panels share, in px (the group minus its handles). */
  space: () => number;
  apply: (next: number[], end: boolean, from?: number[]) => void;
  end: () => void;
  toggle: (handle: number) => void;
}
const GroupContext = createContext<GroupState | null>(null);
const useGroup = (part: string): GroupState => {
  const state = use(GroupContext);
  if (!state) throw new Error(`${part} must be inside a ResizablePanelGroup`);
  return state;
};
const ItemContext = createContext<number | null>(null);
const useItem = (part: string): number => {
  const index = use(ItemContext);
  if (index === null) throw new Error(`${part} must be a direct child of a ResizablePanelGroup`);
  return index;
};

/** Finds the panels and handles in the children, numbering them, and wraps each with its index. */
function scan(children: ReactNode, panels: ResizablePanelProps[]): ReactNode {
  const walk = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      const element = child as ReactElement<{ children?: ReactNode } & ResizablePanelProps>;
      if (element.type === Fragment) {
        return cloneElement(element, undefined, walk(element.props.children));
      }
      const role = typeof element.type === "string" ? undefined : roles.get(element.type);
      if (role === "panel") {
        panels.push(element.props);
        return <ItemContext value={panels.length - 1}>{element}</ItemContext>;
      }
      if (role === "handle") {
        return <ItemContext value={Math.max(0, panels.length - 1)}>{element}</ItemContext>;
      }
      return element;
    });
  return walk(children);
}

const toLimits = (px: boolean, props: ResizablePanelProps): PanelLimits => ({
  min: props.minSize ?? 0,
  max: props.maxSize ?? (px ? Number.POSITIVE_INFINITY : 100),
  collapsible: props.collapsible ?? false,
  collapsedSize: props.collapsedSize ?? 0,
});

/**
 * A row (or column) of resizable panels. Put `ResizablePanel` and `ResizableHandle` in it, a
 * handle between two panels. The layout is yours (`layout`, `onLayout`) or the group's
 * (`defaultLayout`, else the panels' `defaultSize`).
 */
export function ResizablePanelGroup({
  direction,
  orientation,
  unit = "percent",
  layout: layoutProp,
  defaultLayout,
  onLayout,
  onLayoutChanged,
  keyStep,
  storageKey,
  className,
  children,
  ...rest
}: ResizablePanelGroupProps) {
  const dir = direction ?? orientation ?? "horizontal";
  const px = unit === "px";
  const vertical = dir === "vertical";
  const root = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const [measuredSpace, setMeasuredSpace] = useState(0);

  const panels: ResizablePanelProps[] = [];
  const tree = scan(children, panels);
  const count = panels.length;
  const total = px ? (measuredSpace > 0 ? measuredSpace : UNMEASURED) : 100;
  const limits = panels.map((props) => toLimits(px, props));
  const defaults = panels.map((props) => props.defaultSize);
  const ids = panels.map((props, i) => props.id ?? `${baseId}-panel-${i}`);
  const fallback = px
    ? defaults.map((size, i) => size ?? limits[i]!.min)
    : initialLayout(defaults, limits, 100);

  const [stored, setStored] = useControllableState<number[]>({
    value: layoutProp,
    defaultValue: defaultLayout ?? fallback,
    onChange: onLayout,
  });
  const raw = stored.length === count ? stored : fallback;
  const layout = px ? fitRemainder(raw, limits, total) : fitLayout(raw, limits, 100);

  const latest = useRef(layout);
  useEffect(() => {
    latest.current = layout;
  });
  const memory = useRef(new Map<number, number>());
  const round = (n: number) => (px ? Math.round(n) : Math.round(n * 100) / 100);

  const space = () => {
    const el = root.current;
    if (!el) return 0;
    const size = vertical ? el.clientHeight : el.clientWidth;
    let handles = 0;
    for (const child of Array.from(el.children)) {
      if (child.getAttribute("data-slot") !== "resizable-handle") continue;
      const box = child.getBoundingClientRect();
      handles += vertical ? box.height : box.width;
    }
    return Math.max(0, size - handles);
  };

  useEffect(() => {
    if (!px) return;
    const el = root.current;
    if (!el) return;
    const read = () => setMeasuredSpace(space());
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `space` only reads the element and the direction.
  }, [px, vertical]);

  const lastKey = useRef("");
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  });
  useEffect(() => {
    if (!storageKey || layoutProp || lastKey.current === storageKey) return;
    lastKey.current = storageKey;
    try {
      const text = localStorage.getItem(STORAGE_PREFIX + storageKey);
      const value: unknown = text ? JSON.parse(text) : null;
      if (
        Array.isArray(value) &&
        value.length === countRef.current &&
        value.every((n) => typeof n === "number" && Number.isFinite(n))
      ) {
        setStored(value as number[]);
      }
    } catch {
      // Storage is not there or not readable: the default layout stays.
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- runs once per key.
  }, [storageKey, layoutProp]);

  const apply = (next: number[], end: boolean, from = latest.current) => {
    const before = from;
    next.forEach((size, i) => {
      const l = limits[i]!;
      if (isCollapsed(l, size) && !isCollapsed(l, before[i]!)) memory.current.set(i, before[i]!);
    });
    if (!sameLayout(next, latest.current, px)) {
      latest.current = next;
      setStored(next);
    }
    if (end) finish();
  };
  const finish = () => {
    onLayoutChanged?.(latest.current);
    if (!storageKey) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(latest.current));
    } catch {
      // Storage is full or blocked: the layout is just not kept.
    }
  };

  const state: GroupState = {
    direction: dir,
    px,
    measured: !px || measuredSpace > 0,
    layout,
    limits,
    defaults,
    ids,
    keyStep: keyStep ?? (px ? 16 : 5),
    space,
    apply,
    end: finish,
    toggle: (handle) => {
      const next = toggleCollapse(latest.current, limits, handle, memory.current);
      if (next) apply(next.map(round), true);
      else finish();
    },
  };

  return (
    <GroupContext value={state}>
      <div
        data-slot="resizable-panel-group"
        data-panel-group-direction={dir}
        {...rest}
        ref={root}
        className={className}
      >
        {tree}
      </div>
    </GroupContext>
  );
}

/** One panel of a group. Its size comes from the group's layout. */
export function ResizablePanel({
  defaultSize: _defaultSize,
  minSize: _minSize,
  maxSize: _maxSize,
  collapsible,
  collapsedSize: _collapsedSize,
  order: _order,
  id: _id,
  asChild,
  className,
  style,
  ...rest
}: ResizablePanelProps) {
  const group = useGroup("ResizablePanel");
  const index = useItem("ResizablePanel");
  const size = group.layout[index] ?? 0;
  const last = index === group.layout.length - 1;
  const flex = group.px ? (last ? "1 1 0px" : `0 0 ${size}px`) : `${size} 1 0px`;
  const limits = group.limits[index];
  const collapsed = limits ? isCollapsed(limits, size) : false;
  return renderPart("div", className, asChild, {
    "data-slot": "resizable-panel",
    "data-panel-size": Math.round(size * 10) / 10,
    "data-panel-collapsible": collapsible ? "" : undefined,
    "data-state": collapsed ? "collapsed" : "expanded",
    ...rest,
    id: group.ids[index],
    style: { flex, ...style },
  });
}
registerResizablePart(ResizablePanel, "panel");

/**
 * The divider after a panel: a WAI-ARIA window splitter. Drag it, or focus it: the arrows move it
 * (Shift for four times the step), Home and End go to the limits, Enter collapses or expands a
 * collapsible panel next to it, a double click goes back to the default sizes.
 */
export function ResizableHandle({
  withHandle,
  disabled,
  className,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  onDoubleClick,
  ...rest
}: ResizableHandleProps) {
  const group = useGroup("ResizableHandle");
  const index = useItem("ResizableHandle");
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ from: number[]; at: number } | null>(null);
  const { layout, limits, px, direction } = group;
  const row = direction === "horizontal";
  const pos = (event: PointerEvent) => (row ? event.clientX : event.clientY);
  const round = (n: number) => (px ? Math.round(n) : Math.round(n * 100) / 100);
  const hasPair = index + 1 < layout.length;

  const stop = () => {
    const was = drag.current !== null;
    drag.current = null;
    setDragging(false);
    if (was) group.end();
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || disabled || !hasPair) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { from: layout, at: pos(event) };
    setDragging(true);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const d = drag.current;
    if (!d) return;
    const delta = pos(event) - d.at;
    let units = delta;
    if (!px) {
      const space = group.space();
      if (space <= 0) return;
      units = (delta / space) * 100;
    }
    group.apply(
      resizePair(d.from, limits, index, d.from[index]! + units, { snap: true, round }),
      false,
      d.from,
    );
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || !hasPair) return;
    const jump = group.keyStep * (event.shiftKey ? 4 : 1);
    const less = row ? "ArrowLeft" : "ArrowUp";
    const more = row ? "ArrowRight" : "ArrowDown";
    let target: number;
    if (event.key === less) target = layout[index]! - jump;
    else if (event.key === more) target = layout[index]! + jump;
    else if (event.key === "Home") target = Number.NEGATIVE_INFINITY;
    else if (event.key === "End") target = Number.POSITIVE_INFINITY;
    else if (event.key === "Enter") {
      event.preventDefault();
      group.toggle(index);
      return;
    } else return;
    event.preventDefault();
    group.apply(resizePair(layout, limits, index, target, { round }), true);
  };

  const bounds = hasPair ? pairBounds(layout, limits, index) : { lo: 0, hi: 100 };
  const now = layout[index] ?? 0;
  const unit = px ? " px" : "%";
  const state = dragging ? "drag" : hover ? "hover" : "inactive";
  return (
    <div
      role="separator"
      tabIndex={disabled ? undefined : 0}
      aria-orientation={row ? "vertical" : "horizontal"}
      aria-controls={group.ids[index]}
      aria-valuenow={Math.round(now)}
      aria-valuemin={Math.round(bounds.lo)}
      {...(group.measured && Number.isFinite(bounds.hi)
        ? { "aria-valuemax": Math.round(bounds.hi) }
        : {})}
      aria-valuetext={`${Math.round(now)}${unit}`}
      aria-disabled={disabled || undefined}
      data-slot="resizable-handle"
      data-panel-group-direction={direction}
      data-resize-handle-state={disabled ? "inactive" : state}
      data-disabled={disabled ? "" : undefined}
      {...rest}
      className={className}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        stop();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        stop();
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        setHover(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setHover(false);
      }}
      onKeyDown={keys}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (event.defaultPrevented || disabled || !hasPair) return;
        const target = group.defaults[index];
        if (target === undefined) return;
        group.apply(resizePair(layout, limits, index, target, { round }), true);
      }}
    >
      {withHandle ? <div data-slot="resizable-handle-grip" aria-hidden="true" /> : null}
      {children}
    </div>
  );
}
registerResizablePart(ResizableHandle, "handle");
