// A rating in pixel stars (one slider for assistive technology) and a row of numbers (Scale, NPS).

import type { KeyboardEvent, PointerEvent } from "react";
import { useRef, useState } from "react";
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

export interface StarProps {
  /** `1` lit, `0.5` the left half lit, `0` empty. */
  fill?: 0 | 0.5 | 1;
  /** In px; a multiple of 12 keeps every pixel whole. */
  size?: number;
  className?: string;
}

/** One pixel star, decorative: ember when lit, a dim grey when not. */
export function Star({ fill = 1, size = 24, className }: StarProps) {
  return (
    <svg
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

export interface RatingProps {
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
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Stars in pixels. One tab stop that works as a slider: arrows (by one point, or one half with
 * `half`), Home, End, Backspace to clear. Pointer: a click on a star chooses it.
 */
export function Rating({
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
}: RatingProps) {
  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange,
  });
  const [hover, setHover] = useState<number | null>(null);
  const unit = half ? 0.5 : 1;
  const shown = hover ?? current ?? 0;
  const text = `${current ?? 0} out of ${max}`;
  const stars = Array.from({ length: max }, (_, i) => {
    const fill = clamp(shown - i, 0, 1);
    return (fill >= 1 ? 1 : fill >= 0.5 ? 0.5 : 0) as 0 | 0.5 | 1;
  });

  if (readOnly) {
    return (
      <span
        id={id}
        role="img"
        aria-label={`${label}: ${text}`}
        className={cx("fg-rating fg-rating-read", className)}
      >
        {stars.map((fill, i) => (
          <Star key={i} fill={fill} size={size} />
        ))}
      </span>
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
    <span
      id={id}
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
      {stars.map((fill, i) => (
        <span key={i} data-star={i} className="fg-rating-cell">
          <Star fill={fill} size={size} />
        </span>
      ))}
    </span>
  );
}

/* ---------------------------------------------------------------- Scale */

export interface ScaleProps {
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

/** A row of numbers to pick one from: a satisfaction scale, a Net Promoter Score question. */
export function Scale({
  label,
  value,
  defaultValue = null,
  onChange,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
  nps,
  readOnly,
  disabled,
  className,
}: ScaleProps) {
  const [current, setCurrent] = useControllableState<number | null>({
    value,
    defaultValue,
    onChange,
  });
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const stop = current ?? min;
  const go = (n: number) => {
    const next = clamp(n, min, max);
    setCurrent(next);
    refs.current[next - min]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
    <div className={cx("fg-scale", className)}>
      <div className="fg-field-label">{label}</div>
      <div
        role={readOnly ? "img" : "radiogroup"}
        aria-label={readOnly ? `${label}: ${current ?? "no answer"}` : label}
        aria-disabled={disabled || undefined}
        className="fg-scale-row"
        onKeyDown={readOnly || disabled ? undefined : onKeyDown}
        style={{ gridTemplateColumns: `repeat(${numbers.length}, minmax(0, 1fr))` }}
      >
        {numbers.map((n) => {
          const on = n === current;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - min] = el;
              }}
              type="button"
              role={readOnly ? undefined : "radio"}
              aria-checked={readOnly ? undefined : on}
              tabIndex={readOnly || disabled ? -1 : n === stop ? 0 : -1}
              disabled={disabled}
              className={cx(
                "fg-scale-cell",
                on && "fg-scale-on",
                on && nps && `fg-scale-${npsTone(n)}`,
              )}
              onClick={() => !readOnly && setCurrent(on ? null : n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      {lowLabel || highLabel ? (
        <div className="fg-scale-ends" aria-hidden="true">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
