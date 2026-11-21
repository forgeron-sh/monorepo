// A rating in pixel stars (one slider for assistive technology) and a row of numbers (Scale, NPS).

import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
  SVGAttributes,
} from "react";
import { createContext, useContext, useRef, useState } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";

/* ---------------------------------------------------------------- Rating */

/** The star, on the 12-pixel grid of the glyphs. */
const STAR: ReadonlyArray<string> = [
  "............",
  ".....##.....",
  ".....##.....",
  "....####....",
  ".##########.",
  "..########..",
  "...######...",
  "...######...",
  "..###..###..",
  "..##....##..",
  ".#........#.",
  "............",
];

const cells = (from: number, to: number) => {
  let d = "";
  STAR.forEach((row, y) => {
    for (let x = from; x < to; x++) if (row[x] === "#") d += `M${x} ${y}h1v1h-1z`;
  });
  return d;
};
const FULL = cells(0, 12);
const LEFT = cells(0, 6);

export interface StarProps extends Omit<
  SVGAttributes<SVGSVGElement>,
  "className" | "children" | "fill" | "size"
> {
  /** `1` lit, `0.5` the left half lit, `0` empty. */
  fill?: 0 | 0.5 | 1;
  /** In px; a multiple of 12 keeps every pixel whole. */
  size?: number;
  className?: string;
}

/** One pixel star, decorative: ember when lit, a dim grey when not. */
export function Star({ fill = 1, size = 24, className, ...rest }: StarProps) {
  return (
    <svg
      data-slot="star"
      {...rest}
      className={cx("fg-star", className)}
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d={FULL} className="fg-star-off" />
      {fill === 1 ? <path d={FULL} className="fg-star-on" /> : null}
      {fill === 0.5 ? <path d={LEFT} className="fg-star-on" /> : null}
    </svg>
  );
}

export interface RatingProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "onChange" | "defaultValue" | "children" | "className" | "id" | "role"
> {
  /** Names the rating, e.g. "Quality". */
  label: string;
  /** 0 to `max`; `null` for none yet. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  /** How many stars. Default 5. */
  max?: number;
  /** Lets a click on the left half of a star give half a point; arrows then move by half. */
  half?: boolean;
  /** Shows the rating, nothing to choose: read as an image, no tab stop. */
  readOnly?: boolean;
  disabled?: boolean;
  /** Backspace and Delete remove the rating. Default `true`. */
  clearable?: boolean;
  /** Size of a star in px. Default 24. */
  size?: number;
  id?: string;
  className?: string;
  /** Stays undefined: with children, `Rating` is the root of the parts. */
  children?: undefined;
}

/** The root of the parts: the same props, with the `RatingItem`s as children. */
export type RatingRootProps = Omit<RatingProps, "children"> & { children: ReactNode };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface RatingState {
  /** The fill of each star index, for what is shown (the hover, else the value). */
  fillOf: (index: number) => 0 | 0.5 | 1;
  size: number;
  max: number;
}

const RatingContext = createContext<RatingState | null>(null);

/**
 * Stars in pixels. One tab stop that works as a slider: arrows (by one point, or one half with
 * `half`), Home, End, Backspace to clear. Pointer: a click on a star chooses it. With children
 * (`RatingItem`, one per star) it is the root of the parts; without, it draws `max` stars.
 */
export function Rating(props: RatingProps | RatingRootProps) {
  return <RatingRoot {...props} />;
}

function RatingRoot({
  label,
  value,
  defaultValue = null,
  onChange,
  max = 5,
  half,
  readOnly,
  disabled,
  clearable = true,
  size = 24,
  id,
  className,
  children,
  ...rest
}: RatingProps | RatingRootProps) {
  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange,
  });
  const [hover, setHover] = useState<number | null>(null);
  const unit = half ? 0.5 : 1;
  const shown = hover ?? current ?? 0;
  const text = `${current ?? 0} out of ${max}`;
  const state: RatingState = {
    fillOf: (index) => {
      const fill = clamp(shown - index, 0, 1);
      return (fill >= 1 ? 1 : fill >= 0.5 ? 0.5 : 0) as 0 | 0.5 | 1;
    },
    size,
    max,
  };
  const items = children ?? Array.from({ length: max }, (_, i) => <RatingItem key={i} index={i} />);

  if (readOnly) {
    return (
      <RatingContext.Provider value={state}>
        <span
          id={id}
          data-slot="rating"
          {...rest}
          role="img"
          aria-label={`${label}: ${text}`}
          className={cx("fg-rating fg-rating-read", className)}
        >
          {items}
        </span>
      </RatingContext.Provider>
    );
  }

  const pick = (event: PointerEvent<HTMLSpanElement>): number | null => {
    const star = (event.target as HTMLElement).closest<HTMLElement>("[data-star]");
    if (!star) return null;
    const index = Number(star.dataset.star);
    const rect = star.getBoundingClientRect();
    const left = event.clientX - rect.left < rect.width / 2;
    return index + (half && left ? 0.5 : 1);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const now = current ?? 0;
    const next: Record<string, number | null> = {
      ArrowRight: clamp(now + unit, 0, max),
      ArrowUp: clamp(now + unit, 0, max),
      ArrowLeft: clamp(now - unit, 0, max),
      ArrowDown: clamp(now - unit, 0, max),
      Home: 0,
      End: max,
      Backspace: clearable ? null : now,
      Delete: clearable ? null : now,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    setCurrent(next[event.key] ?? null);
  };

  return (
    <RatingContext.Provider value={state}>
      <span
        id={id}
        data-slot="rating"
        {...rest}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current ?? 0}
        aria-valuetext={current === null ? `No rating, out of ${max}` : text}
        aria-disabled={disabled || undefined}
        className={cx("fg-rating", disabled && "fg-rating-disabled", className)}
        onKeyDown={disabled ? undefined : onKeyDown}
        onPointerMove={disabled ? undefined : (event) => setHover(pick(event))}
        onPointerLeave={() => setHover(null)}
        onClick={(event) => {
          if (disabled) return;
          const next = pick(event as unknown as PointerEvent<HTMLSpanElement>);
          if (next !== null) setCurrent(next === current && clearable ? null : next);
        }}
      >
        {items}
      </span>
    </RatingContext.Provider>
  );
}

export interface RatingItemProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Which star this is, from 0: it is lit when the rating passes it. */
  index: number;
  /** Replaces the pixel star: it is told how lit it is (`1`, `0.5`, `0`). */
  children?: ReactNode | ((fill: 0 | 0.5 | 1) => ReactNode);
}

/** One star of a `Rating`. A click or a hover on it chooses its index (plus one). */
export function RatingItem({ index, className, children, ...rest }: RatingItemProps) {
  const state = useContext(RatingContext);
  if (!state) throw new Error("RatingItem goes inside <Rating>.");
  const fill = state.fillOf(index);
  return (
    <span
      data-slot="rating-item"
      {...rest}
      data-star={index}
      className={cx("fg-rating-cell", className)}
    >
      {typeof children === "function"
        ? children(fill)
        : (children ?? <Star fill={fill} size={state.size} />)}
    </span>
  );
}

/* ---------------------------------------------------------------- Scale */

export interface ScaleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children" | "className"
> {
  /** The question, said once for the whole row. */
  label: string;
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  /** The first and last number. Default 0 to 10; use 1 and 5 for a satisfaction scale. */
  min?: number;
  max?: number;
  /** Written under the first and the last number: "Not likely", "Extremely likely". */
  lowLabel?: string;
  highLabel?: string;
  /**
   * NPS colouring of the chosen number: 0 to 6 detractors (danger), 7 and 8 passives (warning),
   * 9 and 10 promoters (success). Meant for 0 to 10.
   */
  nps?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

const npsTone = (n: number) => (n <= 6 ? "bad" : n <= 8 ? "mid" : "good");

/** `label` stays undefined: with a label, `Scale` is the props-driven one. */
export interface ScaleRootProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "className"
> {
  label?: undefined;
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  nps?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

interface ScaleState {
  current: number | null;
  setCurrent: (value: number | null) => void;
  min: number;
  max: number;
  nps: boolean;
  readOnly: boolean;
  disabled: boolean;
  cells: MutableRefObject<Map<number, HTMLButtonElement>>;
}

const ScaleContext = createContext<ScaleState | null>(null);

/** The chosen number, the bounds and the options of the enclosing `Scale`. */
export function useScale(): ScaleState {
  const state = useContext(ScaleContext);
  if (!state) throw new Error("useScale must be used inside a Scale");
  return state;
}

/**
 * A row of numbers to pick one from: a satisfaction scale, a Net Promoter Score question. With
 * `label`, the props-driven one; without, the root of the parts (`ScaleLabel`, `ScaleRow`,
 * `ScaleItem`, `ScaleEnds`).
 */
export function Scale(props: ScaleProps | ScaleRootProps) {
  return props.label !== undefined ? (
    <PropsScale {...(props as ScaleProps)} />
  ) : (
    <ScaleRoot {...(props as ScaleRootProps)} />
  );
}

function PropsScale({ label, lowLabel, highLabel, readOnly, ...rest }: ScaleProps) {
  const { min = 0, max = 10 } = rest;
  return (
    <ScaleRoot readOnly={readOnly} {...rest}>
      <ScaleLabel>{label}</ScaleLabel>
      <ScaleRow label={label}>
        {Array.from({ length: max - min + 1 }, (_, i) => (
          <ScaleItem key={min + i} value={min + i} />
        ))}
      </ScaleRow>
      {lowLabel || highLabel ? (
        <ScaleEnds>
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </ScaleEnds>
      ) : null}
    </ScaleRoot>
  );
}

function ScaleRoot({
  value,
  defaultValue = null,
  onChange,
  min = 0,
  max = 10,
  nps = false,
  readOnly = false,
  disabled = false,
  label: _label,
  className,
  ...rest
}: ScaleRootProps) {
  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange,
  });
  const cells = useRef(new Map<number, HTMLButtonElement>());
  return (
    <ScaleContext.Provider
      value={{ current, setCurrent, min, max, nps, readOnly, disabled, cells }}
    >
      <div data-slot="scale" {...rest} className={cx("fg-scale", className)} />
    </ScaleContext.Provider>
  );
}

/** The question, said once for the whole row. */
export function ScaleLabel({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "className"> & { className?: string }) {
  return <div data-slot="scale-label" {...rest} className={cx("fg-field-label", className)} />;
}

export interface ScaleRowProps extends Omit<ComponentProps<"div">, "className"> {
  /** Names the group; for a read-only scale, the chosen number is added. */
  label?: string;
  className?: string;
}

/** The numbers, in one radio group: the arrow keys, Home and End move between them. */
export function ScaleRow({ label, className, style, onKeyDown, ...rest }: ScaleRowProps) {
  const { current, setCurrent, min, max, readOnly, disabled, cells } = useScale();
  const stop = current ?? min;
  const go = (n: number) => {
    const next = clamp(n, min, max);
    setCurrent(next);
    cells.current.get(next)?.focus();
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const moves: Record<string, number> = {
      ArrowRight: stop + 1,
      ArrowDown: stop + 1,
      ArrowLeft: stop - 1,
      ArrowUp: stop - 1,
      Home: min,
      End: max,
    };
    const to = moves[event.key];
    if (to === undefined) return;
    event.preventDefault();
    go(to);
  };
  return (
    <div
      data-slot="scale-row"
      role={readOnly ? "img" : "radiogroup"}
      {...(label !== undefined
        ? { "aria-label": readOnly ? `${label}: ${current ?? "no answer"}` : label }
        : {})}
      aria-disabled={disabled || undefined}
      {...rest}
      className={cx("fg-scale-row", className)}
      onKeyDown={readOnly || disabled ? onKeyDown : keys}
      style={{ gridTemplateColumns: `repeat(${max - min + 1}, minmax(0, 1fr))`, ...style }}
    />
  );
}

export interface ScaleItemProps extends Omit<ComponentProps<"button">, "className" | "value"> {
  /** The number this cell stands for; it is the label unless there are children. */
  value: number;
  className?: string;
}

/** One number of the scale: a radio, chosen by a click, toggled off by a second one. */
export function ScaleItem({ value, className, children, onClick, ...rest }: ScaleItemProps) {
  const { current, setCurrent, min, nps, readOnly, disabled, cells } = useScale();
  const on = value === current;
  const stop = current ?? min;
  return (
    <button
      ref={(el) => {
        if (el) cells.current.set(value, el);
        else cells.current.delete(value);
      }}
      data-slot="scale-item"
      type="button"
      role={readOnly ? undefined : "radio"}
      aria-checked={readOnly ? undefined : on}
      tabIndex={readOnly || disabled ? -1 : value === stop ? 0 : -1}
      disabled={disabled}
      {...rest}
      className={cx(
        "fg-scale-cell",
        on && "fg-scale-on",
        on && nps && `fg-scale-${npsTone(value)}`,
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!readOnly) setCurrent(on ? null : value);
      }}
    >
      {children ?? value}
    </button>
  );
}

/** Under the first and the last number: "Not likely", "Extremely likely". Decorative. */
export function ScaleEnds({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "className"> & { className?: string }) {
  return (
    <div
      data-slot="scale-ends"
      aria-hidden="true"
      {...rest}
      className={cx("fg-scale-ends", className)}
    />
  );
}
