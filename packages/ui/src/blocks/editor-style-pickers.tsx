// The style panels of a drawing editor: `StrokePicker` (colour, width, dash, cap, opacity, with a
// live preview line) and `FillPicker` (none, a solid colour, or a dither pattern). Both are plain
// values in and out, so they sit in an inspector, a popover or a toolbar menu.
//
// Each is a shorthand: with no children it builds its panel (`fields` picks the rows of the stroke
// picker). With children it is the root of the parts, in any order:
//
//   <StrokePicker label="Stroke" value={stroke} onChange={setStroke}>
//     <StrokePickerPreview /> <StrokePickerColor /> <StrokePickerOpacity />
//   </StrokePicker>
//   <FillPicker label="Fill" value={fill} onChange={setFill}>
//     <FillPickerType /> <FillPickerColor /> <FillPickerPatterns />
//   </FillPicker>

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { ColorPicker } from "../color-picker";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import type { Part } from "../part";
import { Slider } from "../slider";
import {
  EDITOR_CAPS,
  EDITOR_DASHES,
  EDITOR_FILL_PATTERNS,
  EDITOR_PATTERN_NAMES,
  editorDashArray,
  editorOpacityText,
  editorPatternCells,
  type EditorCap,
  type EditorDash,
} from "./editor-model";

/* ---------------------------------------------------------------- stroke */

export interface EditorStroke {
  /** `#RRGGBB`, or null for no line. */
  color: string | null;
  /** In px. */
  width: number;
  dash: EditorDash;
  cap: EditorCap;
  /** 0 to 1. */
  opacity: number;
}

export type StrokeField = "color" | "width" | "dash" | "cap" | "opacity";

export interface StrokePickerProps extends Part<
  Omit<ComponentProps<"fieldset">, "children" | "value" | "defaultValue" | "onChange">
> {
  /** Names the panel: "Stroke". */
  label: string;
  value?: EditorStroke;
  defaultValue?: EditorStroke;
  onChange?: (value: EditorStroke) => void;
  /** Which settings to show, in order. Default all five. */
  fields?: ReadonlyArray<StrokeField>;
  /** The widest line in px. Default 32. */
  maxWidth?: number;
  /** Draws the preview line above the settings. Default `true`. */
  preview?: boolean;
  disabled?: boolean;
  /** The parts. Without them, the preview then the `fields`. */
  children?: ReactNode;
}

const DEFAULT_STROKE: EditorStroke = {
  color: "#ededed",
  width: 2,
  dash: "solid",
  cap: "butt",
  opacity: 1,
};

const FIELDS: ReadonlyArray<StrokeField> = ["color", "width", "dash", "cap", "opacity"];

const DASH_NAMES: Record<EditorDash, string> = {
  solid: "Solid",
  dashed: "Dashed",
  dotted: "Dotted",
};
const CAP_NAMES: Record<EditorCap, string> = { butt: "Flat", round: "Round", square: "Square" };

/** A row of a style panel: its name on the left, the control on the right. */
export function StyleRow({
  title,
  bare,
  className,
  children,
  ...rest
}: Part<Omit<ComponentProps<"div">, "title">> & {
  title: string;
  /** The control writes its own name (a slider): no column for it. */
  bare?: boolean;
}) {
  return (
    <div
      data-slot="style-row"
      {...rest}
      className={cx("fg-edt-style-row", bare && "fg-edt-style-row-bare", className)}
      role="group"
      aria-label={title}
    >
      {bare ? null : (
        <span className="fg-edt-style-name" aria-hidden="true">
          {title}
        </span>
      )}
      {children}
    </div>
  );
}

function DashSample({ dash }: { dash: EditorDash }) {
  const arr = editorDashArray(dash, 2);
  return (
    <svg width={28} height={10} viewBox="0 0 28 10" aria-hidden="true">
      <line
        x1={0}
        y1={5}
        x2={28}
        y2={5}
        stroke="currentColor"
        strokeWidth={2}
        {...(arr ? { strokeDasharray: arr } : {})}
      />
    </svg>
  );
}

interface StrokeContext {
  label: string;
  stroke: EditorStroke;
  set: (change: Partial<EditorStroke>) => void;
  maxWidth: number;
}

const StrokeCtx = createContext<StrokeContext | null>(null);

function useStroke(part: string): StrokeContext {
  const ctx = useContext(StrokeCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StrokePicker>.`);
  return ctx;
}

/** Colour, width, dash, cap and opacity of a line, with a preview. */
export function StrokePicker({
  label,
  value,
  defaultValue = DEFAULT_STROKE,
  onChange,
  fields = FIELDS,
  maxWidth = 32,
  preview = true,
  disabled,
  children,
  className,
  ...rest
}: StrokePickerProps) {
  const [stroke, setStroke] = useControllableState<EditorStroke>({
    ...(value !== undefined ? { value } : {}),
    defaultValue,
    ...(onChange ? { onChange } : {}),
  });
  const set = (change: Partial<EditorStroke>) => setStroke({ ...stroke, ...change });
  const parts: Record<StrokeField, ReactNode> = {
    color: <StrokePickerColor key="color" />,
    width: <StrokePickerWidth key="width" />,
    dash: <StrokePickerDash key="dash" />,
    cap: <StrokePickerCap key="cap" />,
    opacity: <StrokePickerOpacity key="opacity" />,
  };

  return (
    <StrokeCtx.Provider value={{ label, stroke, set, maxWidth }}>
      <fieldset
        data-slot="stroke-picker"
        {...rest}
        className={cx("fg-edt-style", className)}
        disabled={disabled}
      >
        <legend className="fg-edt-style-legend">{label}</legend>
        {children ?? (
          <>
            {preview ? <StrokePickerPreview /> : null}
            {fields.map((field) => parts[field])}
          </>
        )}
      </fieldset>
    </StrokeCtx.Provider>
  );
}

/** The line as it will be drawn. */
export function StrokePickerPreview({
  className,
  ...rest
}: Part<Omit<ComponentProps<"svg">, "children">>) {
  const { label: _label, stroke } = useStroke("StrokePickerPreview");
  const dashArray = editorDashArray(stroke.dash, stroke.width);
  return (
    <svg
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      role="img"
      data-slot="stroke-picker-preview"
      aria-label={`Preview: ${stroke.color ? "" : "no line, "}${stroke.width} pixels, ${DASH_NAMES[stroke.dash].toLowerCase()}, ${editorOpacityText(stroke.opacity)}`}
      {...rest}
      className={cx("fg-edt-style-preview", className)}
    >
      {stroke.color ? (
        <line
          x1={16}
          y1={20}
          x2={184}
          y2={20}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap={stroke.cap}
          strokeOpacity={stroke.opacity}
          {...(dashArray ? { strokeDasharray: dashArray } : {})}
        />
      ) : (
        <text x={100} y={24} textAnchor="middle" className="fg-edt-style-none">
          No line
        </text>
      )}
    </svg>
  );
}

/** The colour of the line, or none. */
export function StrokePickerColor() {
  const { label, stroke, set } = useStroke("StrokePickerColor");
  return (
    <StyleRow title="Colour">
      <ColorPicker
        label={`${label} colour`}
        value={stroke.color}
        onChange={(color) => set({ color })}
        placeholder="No line"
      />
    </StyleRow>
  );
}

/** The width, in a slider. */
export function StrokePickerWidth() {
  const { label, stroke, set, maxWidth } = useStroke("StrokePickerWidth");
  return (
    <StyleRow title="Width" bare>
      <Slider
        label={`${label} width`}
        min={1}
        max={maxWidth}
        step={1}
        value={stroke.width}
        onChange={(v) => set({ width: typeof v === "number" ? v : v[0] })}
        showValue
        formatValue={(n) => `${n} px`}
      />
    </StyleRow>
  );
}

/** Solid, dashed or dotted. */
export function StrokePickerDash() {
  const { label, stroke, set } = useStroke("StrokePickerDash");
  return (
    <StyleRow title="Style">
      <Segmented
        label={`${label} style`}
        iconOnly
        value={stroke.dash}
        onChange={(v) => set({ dash: v as EditorDash })}
        options={EDITOR_DASHES.map((d) => ({
          value: d,
          label: <DashSample dash={d} />,
          ariaLabel: DASH_NAMES[d],
        }))}
        className="fg-edt-style-seg"
      />
    </StyleRow>
  );
}

/** The ends of the line: flat, round or square. */
export function StrokePickerCap() {
  const { label, stroke, set } = useStroke("StrokePickerCap");
  return (
    <StyleRow title="Ends">
      <Segmented
        label={`${label} ends`}
        value={stroke.cap}
        onChange={(v) => set({ cap: v as EditorCap })}
        options={EDITOR_CAPS.map((c) => ({ value: c, label: CAP_NAMES[c] }))}
      />
    </StyleRow>
  );
}

/** The opacity of the line, in a slider. */
export function StrokePickerOpacity() {
  const { label, stroke, set } = useStroke("StrokePickerOpacity");
  return (
    <StyleRow title="Opacity" bare>
      <Slider
        label={`${label} opacity`}
        min={0}
        max={100}
        step={5}
        largeStep={25}
        value={Math.round(stroke.opacity * 100)}
        onChange={(v) => set({ opacity: (typeof v === "number" ? v : v[0]) / 100 })}
        showValue
        formatValue={(n) => `${n}%`}
      />
    </StyleRow>
  );
}

/* ---------------------------------------------------------------- fill */

export type EditorFill =
  | { type: "none" }
  | { type: "solid"; color: string; opacity?: number }
  | { type: "pattern"; pattern: string; color: string; opacity?: number };

export interface FillPickerProps extends Part<
  Omit<ComponentProps<"fieldset">, "children" | "value" | "defaultValue" | "onChange">
> {
  /** Names the panel: "Fill". */
  label: string;
  value?: EditorFill;
  defaultValue?: EditorFill;
  onChange?: (value: EditorFill) => void;
  /** The patterns offered, by id; see `EDITOR_FILL_PATTERNS`. Default all. Empty: no pattern tab. */
  patterns?: ReadonlyArray<string>;
  /** Shows the opacity slider under a solid or pattern fill. Default `true`. */
  opacity?: boolean;
  disabled?: boolean;
  /** The parts. Without them: the type, then colour, patterns and opacity for a fill. */
  children?: ReactNode;
}

const FILL_KINDS = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "pattern", label: "Pattern" },
] as const;

/** A dither pattern drawn with its lit pixels in `color`, as a tile repeated over the box. */
export function PatternSwatch({
  pattern,
  color = "currentColor",
  size = 32,
  opacity = 1,
  className,
}: {
  pattern: string;
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}) {
  const id = useId();
  const cells = editorPatternCells(pattern);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
          {cells.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x * 2} y={y * 2} width={2} height={2} fill={color} />
          ))}
        </pattern>
      </defs>
      <rect width={32} height={32} fill={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

interface FillContext {
  label: string;
  fill: EditorFill;
  setFill: (fill: EditorFill) => void;
  patterns: ReadonlyArray<string>;
}

const FillCtx = createContext<FillContext | null>(null);

function useFill(part: string): FillContext {
  const ctx = useContext(FillCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FillPicker>.`);
  return ctx;
}

/** None, a solid colour, or a dither pattern, with opacity. */
export function FillPicker({
  label,
  value,
  defaultValue = { type: "none" },
  onChange,
  patterns = Object.keys(EDITOR_FILL_PATTERNS),
  opacity = true,
  disabled,
  children,
  className,
  ...rest
}: FillPickerProps) {
  const [fill, setFill] = useControllableState<EditorFill>({
    ...(value !== undefined ? { value } : {}),
    defaultValue,
    ...(onChange ? { onChange } : {}),
  });
  return (
    <FillCtx.Provider value={{ label, fill, setFill, patterns }}>
      <fieldset
        data-slot="fill-picker"
        {...rest}
        className={cx("fg-edt-style", className)}
        disabled={disabled}
      >
        <legend className="fg-edt-style-legend">{label}</legend>
        {children ?? (
          <>
            <FillPickerType />
            {fill.type === "none" ? (
              <p className="fg-edt-style-note">No fill: the shape is see-through.</p>
            ) : (
              <>
                <FillPickerColor />
                <FillPickerPatterns />
                {opacity ? <FillPickerOpacity /> : null}
              </>
            )}
          </>
        )}
      </fieldset>
    </FillCtx.Provider>
  );
}

/** None, Solid, Pattern. Choosing keeps the last colour. */
export function FillPickerType() {
  const { label, fill, setFill, patterns } = useFill("FillPickerType");
  const kinds = FILL_KINDS.filter((k) => k.value !== "pattern" || patterns.length > 0);
  const last = fill.type === "none" ? "#ff4f1f" : fill.color;
  const choose = (type: string) => {
    if (type === "none") setFill({ type: "none" });
    else if (type === "solid") setFill({ type: "solid", color: last });
    else setFill({ type: "pattern", pattern: patterns[0]!, color: last });
  };
  return <Segmented label={`${label} type`} options={kinds} value={fill.type} onChange={choose} />;
}

/** The colour of the fill. Nothing for "none". */
export function FillPickerColor() {
  const { label, fill, setFill } = useFill("FillPickerColor");
  if (fill.type === "none") return null;
  return (
    <StyleRow title="Colour">
      <ColorPicker
        label={`${label} colour`}
        value={fill.color}
        clearable={false}
        onChange={(color) => color && setFill({ ...fill, color })}
      />
    </StyleRow>
  );
}

/** The dither patterns, as radios. Nothing unless the fill is a pattern. */
export function FillPickerPatterns({
  className,
  ...rest
}: Part<Omit<ComponentProps<"div">, "children">>) {
  const { label, fill, setFill, patterns } = useFill("FillPickerPatterns");
  if (fill.type !== "pattern") return null;
  return (
    <div
      role="radiogroup"
      aria-label={`${label} pattern`}
      data-slot="fill-picker-patterns"
      {...rest}
      className={cx("fg-edt-patterns", className)}
    >
      {patterns.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={fill.pattern === id}
          aria-label={EDITOR_PATTERN_NAMES[id] ?? id}
          title={EDITOR_PATTERN_NAMES[id] ?? id}
          className="fg-edt-pattern"
          onClick={() => setFill({ ...fill, pattern: id })}
        >
          <PatternSwatch pattern={id} color={fill.color} size={28} />
        </button>
      ))}
    </div>
  );
}

/** The opacity of the fill. Nothing for "none". */
export function FillPickerOpacity() {
  const { label, fill, setFill } = useFill("FillPickerOpacity");
  if (fill.type === "none") return null;
  return (
    <StyleRow title="Opacity" bare>
      <Slider
        label={`${label} opacity`}
        min={0}
        max={100}
        step={5}
        largeStep={25}
        value={Math.round((fill.opacity ?? 1) * 100)}
        onChange={(v) => setFill({ ...fill, opacity: (typeof v === "number" ? v : v[0]) / 100 })}
        showValue
        formatValue={(n) => `${n}%`}
      />
    </StyleRow>
  );
}
