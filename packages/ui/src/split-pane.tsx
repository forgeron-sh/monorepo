// Two panes with a divider between them that can be dragged or moved with the arrow keys.

import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useId, useRef } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";

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

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

/**
 * Two panes and a divider. Drag it, or focus it and press the arrows (Shift for bigger jumps),
 * Home and End for the limits; a double click goes back to the first size. The size is yours
 * (`size` and `onChange`) or the component's (`defaultSize`).
 */
export function SplitPane({
  label,
  first,
  second,
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
}: SplitPaneProps) {
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

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { from: current, at: row ? event.clientX : event.clientY };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    set(drag.current.from + (row ? event.clientX : event.clientY) - drag.current.at);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    onChangeEnd?.(current);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const jump = keyStep * (event.shiftKey ? 4 : 1);
    const less = row ? "ArrowLeft" : "ArrowUp";
    const more = row ? "ArrowRight" : "ArrowDown";
    let next: number;
    if (event.key === less) next = current - jump;
    else if (event.key === more) next = current + jump;
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = limit();
    else return;
    event.preventDefault();
    const clamped = Math.round(clamp(next, min, limit()));
    setCurrent(clamped);
    onChangeEnd?.(clamped);
  };

  return (
    <div
      ref={root}
      className={cx("fg-split", row ? "fg-split-row" : "fg-split-col", className)}
      style={
        {
          "--fg-split-size": `${current}px`,
          "--fg-split-min": `${min}px`,
          "--fg-split-min-second": `${minSecond}px`,
          ...(max !== undefined ? { "--fg-split-max": `${max}px` } : {}),
        } as React.CSSProperties
      }
    >
      <div id={firstId} className="fg-split-first">
        {first}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={row ? "vertical" : "horizontal"}
        aria-controls={firstId}
        aria-valuenow={current}
        aria-valuemin={min}
        {...(max !== undefined ? { "aria-valuemax": max } : {})}
        aria-valuetext={`${current} px`}
        className="fg-split-bar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => {
          set(defaultSize);
          onChangeEnd?.(defaultSize);
        }}
      />
      <div className="fg-split-second">{second}</div>
    </div>
  );
}
