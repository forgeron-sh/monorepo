import type { ReactNode } from "react";
import { cx } from "./cx";

export interface KbdProps {
  /** One key per entry: `["⌘", "K"]` draws two keys. A string is a single key. */
  keys: string | ReadonlyArray<string>;
  className?: string;
}

/** A keyboard shortcut, one framed mono cap per key. */
export function Kbd({ keys, className }: KbdProps) {
  const list = typeof keys === "string" ? [keys] : keys;
  return (
    <span className={cx("fg-kbds", className)}>
      {list.map((key, i) => (
        <kbd key={`${key}-${i}`} className="fg-kbd">
          {key}
        </kbd>
      ))}
    </span>
  );
}

export interface ProgressProps {
  /** Names the bar for assistive technology, and is written above it. */
  label: string;
  /** Between 0 and `max`. Absent: the work has no known end, a block runs along the track. */
  value?: number;
  max?: number;
  /** Writes the percentage next to the label. */
  showValue?: boolean;
  /** `accent` (default) for work in progress, `success` once it reads as done, `danger` for a quota overrun. */
  tone?: "accent" | "success" | "danger";
  /** Splits the track into this many blocks: steps of a flow, days of a quota. */
  segments?: number;
  className?: string;
}

/** How far a piece of work or a quota has gone: a sharp track filled from the left. */
export function Progress({
  label,
  value,
  max = 100,
  showValue,
  tone = "accent",
  segments,
  className,
}: ProgressProps) {
  const known = value !== undefined;
  const ratio = known ? Math.min(Math.max(value / max, 0), 1) : 0;
  const percent = Math.round(ratio * 100);
  const blocks = known && segments !== undefined && segments > 0 ? segments : 0;
  return (
    <div className={cx("fg-progress", `fg-progress-${tone}`, className)}>
      <div className="fg-progress-head">
        <span>{label}</span>
        {showValue && known ? <span className="fg-progress-value">{percent}%</span> : null}
      </div>
      <div
        className={cx(
          "fg-progress-track",
          !known && "fg-progress-indeterminate",
          blocks > 0 && "fg-progress-segmented",
        )}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        {...(known ? { "aria-valuenow": value } : {})}
      >
        {blocks > 0 ? (
          Array.from({ length: blocks }, (_, i) => (
            <span
              key={i}
              className={cx("fg-progress-seg", i < Math.round(ratio * blocks) && "fg-progress-on")}
            />
          ))
        ) : (
          <span className="fg-progress-fill" style={known ? { width: `${percent}%` } : undefined} />
        )}
      </div>
    </div>
  );
}

export interface SeparatorProps {
  /** `vertical` between items of a row. */
  orientation?: "horizontal" | "vertical";
  /** `hatch`: the hatched band of the lab language, closed by a line above and below. */
  variant?: "line" | "hatch";
  /** A short mono label on a `hatch` band, e.g. "/0.2 → Settings". */
  children?: ReactNode;
  className?: string;
}

/** A line between two groups, or the hatched band that announces a section. */
export function Separator({
  orientation = "horizontal",
  variant = "line",
  children,
  className,
}: SeparatorProps) {
  if (variant === "hatch") {
    return (
      <div className={cx("fg-sep-hatch", className)} role="separator">
        {children ? <span>{children}</span> : null}
      </div>
    );
  }
  return (
    <div
      className={cx("fg-sep", orientation === "vertical" && "fg-sep-vertical", className)}
      role="separator"
      aria-orientation={orientation}
    />
  );
}
