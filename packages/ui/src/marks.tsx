import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cx } from "./cx";

export interface KbdProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> {
  /** One key per entry: `["⌘", "K"]` draws two keys. A string is a single key. */
  keys: string | ReadonlyArray<string>;
  className?: string;
}

/**
 * A keyboard shortcut, one framed mono cap per key. Without `keys`: shadcn's `Kbd`, one cap around
 * its children (`KbdGroup` groups several), D-156.
 */
export function Kbd(props: KbdProps | KbdCapProps) {
  return props.keys !== undefined ? (
    <KbdKeys {...(props as KbdProps)} />
  ) : (
    <KbdCap {...(props as KbdCapProps)} />
  );
}

/** `keys` stays undefined: with keys, `Kbd` draws one cap per key. */
export type KbdCapProps = HTMLAttributes<HTMLElement> & { keys?: undefined };

function KbdCap({ keys: _keys, className, ...rest }: KbdCapProps) {
  return <kbd data-slot="kbd" {...rest} className={cx("fg-kbd", className)} />;
}

/** Several caps side by side (shadcn's `KbdGroup`). */
export function KbdGroup({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <span data-slot="kbd-group" {...rest} className={cx("fg-kbds", className)} />;
}

function KbdKeys({ keys, className, ...rest }: KbdProps) {
  const list = typeof keys === "string" ? [keys] : keys;
  return (
    <span data-slot="kbd" {...rest} className={cx("fg-kbds", className)}>
      {list.map((key, i) => (
        <kbd key={`${key}-${i}`} className="fg-kbd">
          {key}
        </kbd>
      ))}
    </span>
  );
}

export interface ProgressProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "className" | "children" | "role"
> {
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

/**
 * How far a piece of work or a quota has gone: a sharp track filled from the left. Without `label`:
 * shadcn's Progress (`value` from 0 to 100), D-156.
 */
export function Progress(props: ProgressProps | ProgressRootProps) {
  return props.label !== undefined ? (
    <LabelledProgress {...(props as ProgressProps)} />
  ) : (
    <ProgressRoot {...(props as ProgressRootProps)} />
  );
}

/** `label` stays undefined: with a label, `Progress` is the props-driven one. */
export type ProgressRootProps = Omit<ComponentProps<typeof BaseProgress.Root>, "className"> & {
  className?: string;
  label?: undefined;
};

function ProgressRoot({ className, label: _label, children, ...rest }: ProgressRootProps) {
  return (
    <BaseProgress.Root
      data-slot="progress"
      {...rest}
      className={cx("fg-progress fg-progress-accent", className)}
    >
      {children}
      <BaseProgress.Track className="fg-progress-track">
        <BaseProgress.Indicator className="fg-progress-fill" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

function LabelledProgress({
  label,
  value,
  max = 100,
  showValue,
  tone = "accent",
  segments,
  className,
  ...rest
}: ProgressProps) {
  const known = value !== undefined;
  const ratio = known ? Math.min(Math.max(value / max, 0), 1) : 0;
  const percent = Math.round(ratio * 100);
  const blocks = known && segments !== undefined && segments > 0 ? segments : 0;
  return (
    <div
      data-slot="progress"
      {...rest}
      className={cx("fg-progress", `fg-progress-${tone}`, className)}
    >
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

export interface SeparatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "className" | "children" | "role"
> {
  /** `vertical` between items of a row. */
  orientation?: "horizontal" | "vertical";
  /** `hatch`: the hatched band of the lab language, closed by a line above and below. */
  variant?: "line" | "hatch";
  /** A short mono label on a `hatch` band, e.g. "/0.2 → Settings". */
  children?: ReactNode;
  /** shadcn's `decorative`: the line is only visual, hidden from assistive technology. */
  decorative?: boolean;
  className?: string;
}

/** A line between two groups, or the hatched band that announces a section. */
export function Separator({
  orientation = "horizontal",
  variant = "line",
  children,
  decorative,
  className,
  ...rest
}: SeparatorProps) {
  if (variant === "hatch") {
    return (
      <div
        data-slot="separator"
        {...rest}
        className={cx("fg-sep-hatch", className)}
        role="separator"
      >
        {children ? <span>{children}</span> : null}
      </div>
    );
  }
  return (
    <div
      data-slot="separator"
      {...rest}
      className={cx("fg-sep", orientation === "vertical" && "fg-sep-vertical", className)}
      {...(decorative ? { role: "none" } : { role: "separator", "aria-orientation": orientation })}
    />
  );
}
