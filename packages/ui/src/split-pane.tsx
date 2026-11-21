// Two panes with a divider between them that can be dragged or moved with the arrow keys.
// `SplitPane` takes the props form (`first`, `second`) or, as in shadcn, its parts:
// `SplitPanePanel` twice (the second `secondary`) around a `SplitPaneHandle` (D-156).

import type { ComponentProps, CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { createContext, use, useId, useRef } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { renderPart, type Part } from "./shell-part";

export interface SplitPaneProps {
  /** Names the divider for assistive technology: "Resize the sidebar". */
  label: string;
  first: ReactNode;
  second: ReactNode;
  /** `horizontal` (default): side by side, a vertical divider. `vertical`: one above the other. */
  direction?: "horizontal" | "vertical";
  /** The size of the first pane in px; the second takes the rest. */
  size?: number;
  defaultSize?: number;
  onChange?: (size: number) => void;
  /** Fires when a drag ends or a key is pressed: the moment to save the size. */
  onChangeEnd?: (size: number) => void;
  /** The least the first pane can shrink to, in px. Default 160. */
  min?: number;
  /** The most the first pane can grow to, in px; by default what leaves `minSecond` to the other. */
  max?: number;
  /** The least the second pane can shrink to, in px. Default 160. */
  minSecond?: number;
  /** What an arrow key moves the divider by, in px; with Shift, four times as much. Default 16. */
  keyStep?: number;
  className?: string;
}

/** The parts form: no `first`; the children are two `SplitPanePanel` and a `SplitPaneHandle`. */
export interface SplitPaneRootProps extends Omit<
  Part<ComponentProps<"div">>,
  "onChange" | "defaultValue"
> {
  first?: undefined;
  second?: undefined;
  label?: undefined;
  direction?: "horizontal" | "vertical";
  size?: number;
  defaultSize?: number;
  onChange?: (size: number) => void;
  onChangeEnd?: (size: number) => void;
  min?: number;
  max?: number;
  minSecond?: number;
  keyStep?: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

interface SplitState {
  current: number;
  row: boolean;
  min: number;
  max: number | undefined;
  defaultSize: number;
  firstId: string;
  set: (next: number) => void;
  /** Sets the size and says it is final. */
  commit: (next: number) => void;
  end: () => void;
  keyStep: number;
  limit: () => number;
  /** The drag in progress: where the pane was and where the pointer was. */
  dragFrom: () => { from: number; at: number } | null;
  startDrag: (from: number, at: number) => void;
  stopDrag: () => boolean;
}
const SplitContext = createContext<SplitState | null>(null);
const useSplit = (part: string): SplitState => {
  const state = use(SplitContext);
  if (!state) throw new Error(`${part} must be inside a SplitPane`);
  return state;
};

/**
 * Two panes and a divider. Drag it, or focus it and press the arrows (Shift for bigger jumps),
 * Home and End for the limits; a double click goes back to the first size. The size is yours
 * (`size` and `onChange`) or the component's (`defaultSize`). With `first` and `second`: the whole
 * thing; without: the root of `SplitPanePanel` and `SplitPaneHandle`.
 */
export function SplitPane(props: SplitPaneProps | SplitPaneRootProps) {
  if (props.first === undefined) return <SplitPaneRoot {...(props as SplitPaneRootProps)} />;
  const { label, first, second, ...rest } = props as SplitPaneProps;
  return (
    <SplitPaneRoot {...rest}>
      <SplitPanePanel>{first}</SplitPanePanel>
      <SplitPaneHandle label={label} />
      <SplitPanePanel secondary>{second}</SplitPanePanel>
    </SplitPaneRoot>
  );
}

function SplitPaneRoot({
  direction = "horizontal",
  size,
  defaultSize = 320,
  onChange,
  onChangeEnd,
  min = 160,
  max,
  minSecond = 160,
  keyStep = 16,
  className,
  style,
  children,
  first: _first,
  second: _second,
  label: _label,
  ...rest
}: SplitPaneRootProps) {
  const [current, setCurrent] = useControllableState<number>({
    value: size,
    defaultValue: defaultSize,
    onChange,
  });
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ from: number; at: number } | null>(null);
  const firstId = useId();
  const row = direction === "horizontal";

  /** The most the first pane may take now: what the container leaves to the second. */
  const limit = () => {
    const box = root.current?.getBoundingClientRect();
    const measured = box ? (row ? box.width : box.height) : 0;
    // Not laid out (hidden, or no layout engine): nothing to hold the first pane back.
    const total = measured > 0 ? measured : Infinity;
    const room = total - minSecond - 8;
    return Math.min(max ?? Infinity, room);
  };
  const set = (next: number) => setCurrent(Math.round(clamp(next, min, limit())));
  const commit = (next: number) => {
    const clamped = Math.round(clamp(next, min, limit()));
    setCurrent(clamped);
    onChangeEnd?.(clamped);
  };

  const state: SplitState = {
    current,
    row,
    min,
    max,
    defaultSize,
    firstId,
    set,
    commit,
    end: () => onChangeEnd?.(current),
    keyStep,
    limit,
    dragFrom: () => drag.current,
    startDrag: (from, at) => {
      drag.current = { from, at };
    },
    stopDrag: () => {
      const was = drag.current !== null;
      drag.current = null;
      return was;
    },
  };

  return (
    <SplitContext value={state}>
      <div
        {...rest}
        ref={root}
        className={cx("fg-split", row ? "fg-split-row" : "fg-split-col", className)}
        style={
          {
            "--fg-split-size": `${current}px`,
            "--fg-split-min": `${min}px`,
            "--fg-split-min-second": `${minSecond}px`,
            ...(max !== undefined ? { "--fg-split-max": `${max}px` } : {}),
            ...style,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </SplitContext>
  );
}

export interface SplitPanePanelProps extends Part<ComponentProps<"div">> {
  /** The pane that takes what the first leaves. Default: the first one, which has the size. */
  secondary?: boolean;
  asChild?: boolean;
}
/** One of the two panes. */
export function SplitPanePanel({ secondary, asChild, className, ...rest }: SplitPanePanelProps) {
  const split = useSplit("SplitPanePanel");
  return renderPart(
    "div",
    cx(secondary ? "fg-split-second" : "fg-split-first", className),
    asChild,
    {
      ...(secondary ? {} : { id: split.firstId }),
      ...rest,
    },
  );
}

export interface SplitPaneHandleProps extends Part<Omit<ComponentProps<"div">, "aria-label">> {
  /** Names the divider for assistive technology: "Resize the sidebar". */
  label: string;
}
/** The divider: drag it, or focus it and use the arrows, Home and End; a double click resets. */
export function SplitPaneHandle({
  label,
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  onDoubleClick,
  ...rest
}: SplitPaneHandleProps) {
  const split = useSplit("SplitPaneHandle");
  const { current, row, min, max } = split;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    split.startDrag(current, row ? event.clientX : event.clientY);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const drag = split.dragFrom();
    if (!drag) return;
    split.set(drag.from + (row ? event.clientX : event.clientY) - drag.at);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (split.stopDrag()) split.end();
  };
  const cancel = (event: PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event);
    if (split.stopDrag()) split.end();
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const jump = split.keyStep * (event.shiftKey ? 4 : 1);
    const less = row ? "ArrowLeft" : "ArrowUp";
    const more = row ? "ArrowRight" : "ArrowDown";
    let next: number;
    if (event.key === less) next = current - jump;
    else if (event.key === more) next = current + jump;
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = split.limit();
    else return;
    event.preventDefault();
    split.commit(next);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={row ? "vertical" : "horizontal"}
      aria-controls={split.firstId}
      aria-valuenow={current}
      aria-valuemin={min}
      {...(max !== undefined ? { "aria-valuemax": max } : {})}
      aria-valuetext={`${current} px`}
      {...rest}
      aria-label={label}
      className={cx("fg-split-bar", className)}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onKeyDown={keys}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (!event.defaultPrevented) split.commit(split.defaultSize);
      }}
    />
  );
}
