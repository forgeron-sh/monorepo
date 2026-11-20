// A value on a track, or a range between two. Base UI gives the pointer and keyboard behaviour
// (arrows by `step`, Page Up and Down by `largeStep`, Home and End), the look is ours.

import { Slider as Base } from "@base-ui/react/slider";
import type { ComponentProps } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";

export type SliderValue = number | readonly [number, number];

export interface SliderMark {
  value: number;
  /** Written under the tick; without it only the tick shows. */
  label?: string;
}

export interface SliderProps {
  /** Names the slider (and its two thumbs, "from" and "to", for a range). */
  label: string;
  /** A number for one thumb, `[from, to]` for a range. */
  value?: SliderValue;
  defaultValue?: SliderValue;
  onChange?: (value: SliderValue) => void;
  /** Fires when the pointer is released or a key is pressed: the moment to save. */
  onChangeEnd?: (value: SliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  /** The jump of Page Up and Page Down. Default ten steps. */
  largeStep?: number;
  /** Ticks under the track; a number is a tick, an object a tick with its label. */
  marks?: ReadonlyArray<number | SliderMark>;
  /** Writes the value at the end of the label row. */
  showValue?: boolean;
  /** How a number is written (in the value, and read by assistive technology). */
  formatValue?: (value: number) => string;
  /** A thumb cannot come closer than this many steps to the next one. Default 0. */
  minGap?: number;
  disabled?: boolean;
  /** The `name` of the hidden inputs, for a form. */
  name?: string;
  id?: string;
  className?: string;
}

const asArray = (v: SliderValue): number[] => (typeof v === "number" ? [v] : [...v]);

/**
 * One value, or a range, with ticks and a written value. Arrows, Page keys, Home and End work.
 * Without `label`: shadcn's Slider (`value` and `defaultValue` as number arrays, `onValueChange`),
 * D-156.
 */
export function Slider(props: SliderProps | SliderRootProps) {
  return props.label !== undefined ? (
    <LabelledSlider {...(props as SliderProps)} />
  ) : (
    <SliderRoot {...(props as SliderRootProps)} />
  );
}

/** `label` stays undefined: with a label, `Slider` is the props-driven one. */
export type SliderRootProps = Omit<ComponentProps<typeof Base.Root>, "className"> & {
  className?: string;
  label?: undefined;
};

function SliderRoot({
  className,
  label: _label,
  value,
  defaultValue,
  min = 0,
  ...rest
}: SliderRootProps) {
  const shown = value ?? defaultValue ?? min;
  const count = Array.isArray(shown) ? shown.length : 1;
  return (
    <Base.Root
      {...rest}
      min={min}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      thumbAlignment="center"
      className={cx("fg-slider", className)}
    >
      <Base.Control className="fg-slider-control">
        <Base.Track className="fg-slider-track">
          <Base.Indicator className="fg-slider-fill" />
          {Array.from({ length: count }, (_, i) => (
            <Base.Thumb key={i} index={i} className="fg-slider-thumb" />
          ))}
        </Base.Track>
      </Base.Control>
    </Base.Root>
  );
}

function LabelledSlider({
  label,
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  largeStep,
  marks,
  showValue,
  formatValue = String,
  minGap = 0,
  disabled,
  name,
  id,
  className,
}: SliderProps) {
  const [current, setCurrent] = useControllableState<SliderValue>({
    value,
    defaultValue: defaultValue ?? min,
    onChange,
  });
  const values = asArray(current);
  const range = typeof current !== "number";
  const at = (n: number) => (max === min ? 0 : ((n - min) / (max - min)) * 100);
  const ticks = (marks ?? []).map((m) => (typeof m === "number" ? { value: m } : m));
  const written = values.map(formatValue).join(" – ");
  const done = (next: unknown) => onChangeEnd?.(next as SliderValue);

  return (
    <div className={cx("fg-slider", disabled && "fg-slider-disabled", className)}>
      <div className="fg-slider-head">
        <span className="fg-field-label" id={id ? `${id}-label` : undefined}>
          {label}
        </span>
        {showValue ? <output className="fg-slider-value">{written}</output> : null}
      </div>
      <Base.Root
        value={range ? values : values[0]}
        onValueChange={(next) => {
          const list = asArray(next as SliderValue);
          setCurrent(range ? ([list[0] ?? min, list[1] ?? max] as const) : (list[0] ?? min));
        }}
        onValueCommitted={done}
        min={min}
        max={max}
        step={step}
        {...(largeStep !== undefined ? { largeStep } : {})}
        minStepsBetweenValues={minGap}
        disabled={disabled}
        {...(name ? { name } : {})}
        thumbAlignment="center"
      >
        <Base.Control className="fg-slider-control">
          <Base.Track className="fg-slider-track">
            <Base.Indicator className="fg-slider-fill" />
            {values.map((_, i) => (
              <Base.Thumb
                key={i}
                index={i}
                {...(id && i === 0 ? { id } : {})}
                aria-label={range ? `${label}, ${i === 0 ? "from" : "to"}` : label}
                getAriaValueText={(_text, v) => formatValue(v)}
                className="fg-slider-thumb"
              />
            ))}
          </Base.Track>
        </Base.Control>
      </Base.Root>
      {ticks.length > 0 ? (
        <div className="fg-slider-marks" aria-hidden="true">
          {ticks.map((m) => (
            <span key={m.value} className="fg-slider-mark" style={{ left: `${at(m.value)}%` }}>
              {"label" in m && m.label ? (
                <span className="fg-slider-mark-label">{m.label}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
