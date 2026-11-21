// A colour from a palette of squares, or typed as hex. No gradients, no sliders: the colours of
// the design system, and any other one by its code. `ColorPicker` is the props form; its parts
// (D-156) are `ColorPickerRoot`, `ColorPickerTrigger`, `ColorPickerContent` (the popover, from the
// Popover parts), `ColorPickerPanel`, `ColorPickerSwatches`, `ColorPickerSwatch`,
// `ColorPickerInput` and `ColorPickerClear`.

import { Cancel01Icon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useRef, useState } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface ColorOption {
  /** `#RRGGBB`. */
  value: string;
  /** Said to assistive technology and shown as the tooltip: "Ember". */
  label: string;
}

/** The accent, the three states and the greys of the tokens (dark theme), as hex codes. */
export const COLOR_PALETTE: ReadonlyArray<ColorOption> = [
  { value: "#ff4f1f", label: "Ember" },
  { value: "#ffb020", label: "Amber" },
  { value: "#3ddc84", label: "Green" },
  { value: "#ff6b81", label: "Rose" },
  { value: "#ededed", label: "White" },
  { value: "#8f8f8f", label: "Grey" },
  { value: "#5e5e5e", label: "Dim grey" },
  { value: "#2e2e2e", label: "Line grey" },
];

/** `#abc` or `abc` or `#AABBCC` to `#aabbcc`, or null when it is not a colour. */
export function normalizeHex(input: string): string | null {
  const hit = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!hit) return null;
  const hex = hit[1]!.toLowerCase();
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return `#${full}`;
}

export interface ColorPickerProps {
  /** Names the control, e.g. "Label colour". */
  label: string;
  /** `#RRGGBB`, or null for none. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** The squares offered. Default `COLOR_PALETTE`. */
  palette?: ReadonlyArray<ColorOption>;
  /** Offers a field to type any hex code. Default `true`. */
  hex?: boolean;
  /** Offers to remove the colour. Default `true`. */
  clearable?: boolean;
  /** Shows the palette in place, with no button and popup: for a dialog or a settings page. */
  inline?: boolean;
  /** Squares per row. Default 4. */
  columns?: number;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Drawn in the button in place of the swatch and the name. */
  children?: ReactNode;
}

interface ColorState {
  label: string;
  value: string | null;
  setValue: (value: string | null) => void;
  palette: ReadonlyArray<ColorOption>;
  columns: number;
  placeholder: string;
  disabled: boolean | undefined;
  typed: string | null;
  setTyped: (text: string | null) => void;
}

const ColorContext = createContext<ColorState | null>(null);

function useColor(): ColorState {
  const state = useContext(ColorContext);
  if (!state) throw new Error("ColorPicker parts go inside <ColorPickerRoot>.");
  return state;
}

/** The colour of the enclosing picker and how to change it. */
export function useColorPicker(): {
  value: string | null;
  setValue: (value: string | null) => void;
  palette: ReadonlyArray<ColorOption>;
} {
  const c = useColor();
  return { value: c.value, setValue: c.setValue, palette: c.palette };
}

export interface ColorPickerRootProps {
  /** Names the control, e.g. "Label colour". */
  label: string;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  palette?: ReadonlyArray<ColorOption>;
  /** Squares per row, for the arrows. Default 4. */
  columns?: number;
  /** Said in the trigger while there is no colour. Default "No colour". */
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** `ColorPickerPanel` directly, in place, with no button and popup. */
  inline?: boolean;
  /** For the inline frame. */
  className?: string;
  /** With `inline`, a `ColorPickerPanel`; without, a `ColorPickerTrigger` and a `ColorPickerContent`. */
  children?: ReactNode;
}

/**
 * The root of the parts. Holds the colour; as a popup (the default) it is the popover the trigger
 * and the content belong to, with `inline` it is a frame around a panel. The props form
 * (`ColorPicker`) has its own `children`, the content of the button, hence the other name.
 */
export function ColorPickerRoot({
  label,
  value: valueProp,
  defaultValue = null,
  onChange,
  palette = COLOR_PALETTE,
  columns = 4,
  placeholder = "No colour",
  open: openProp,
  onOpenChange,
  disabled,
  inline,
  className,
  children,
}: ColorPickerRootProps) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [typed, setTyped] = useState<string | null>(null);
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const state: ColorState = {
    label,
    value,
    setValue,
    palette,
    columns,
    placeholder,
    disabled,
    typed,
    setTyped,
  };
  return (
    <ColorContext.Provider value={state}>
      {inline ? (
        <div data-slot="color-picker" className={cx("fg-color-inline", className)}>
          {children}
        </div>
      ) : (
        <Popover open={open} onOpenChange={(next) => setOpen(next)}>
          {children}
        </Popover>
      )}
    </ColorContext.Provider>
  );
}

/** The button that opens the palette: a square of the colour and its name. */
export function ColorPickerTrigger({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"button">, "type">) {
  const c = useColor();
  const name = c.value
    ? (c.palette.find((p) => p.value === c.value)?.label ?? c.value)
    : c.placeholder;
  return (
    <PopoverTrigger
      disabled={c.disabled}
      aria-label={`${c.label}: ${name}`}
      data-slot="color-picker-trigger"
      {...(rest as object)}
      className={cx("fg-selm-trigger fg-color-trigger", !c.value && "fg-selm-empty", className)}
    >
      {children ?? (
        <>
          <span
            className="fg-swatch-mark"
            style={c.value ? { background: c.value } : undefined}
            aria-hidden="true"
          />
          <span>{name}</span>
        </>
      )}
    </PopoverTrigger>
  );
}

/** The popup under the trigger; put a `ColorPickerPanel` in it. */
export function ColorPickerContent({
  className,
  children,
  ...rest
}: Omit<ComponentProps<typeof PopoverContent>, "side">) {
  const c = useColor();
  return (
    <PopoverContent
      align="start"
      sideOffset={4}
      aria-label={c.label}
      data-slot="color-picker-content"
      {...rest}
      className={cx("fg-color-pop", className)}
    >
      {children}
    </PopoverContent>
  );
}

/** The column that holds the swatches, the hex field and the remove button. */
export function ColorPickerPanel({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="color-picker-panel" {...rest} className={cx("fg-color-panel", className)} />
  );
}

/** The grid of squares, one tab stop; arrows move in two dimensions. Default: the palette. */
export function ColorPickerSwatches({
  className,
  style,
  children,
  onKeyDown,
  ...rest
}: ComponentProps<"div">) {
  const c = useColor();
  const grid = useRef<HTMLDivElement>(null);
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const cells = [...(grid.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const at = cells.indexOf(document.activeElement as HTMLButtonElement);
    const to: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: at + c.columns,
      ArrowUp: at - c.columns,
      Home: 0,
      End: cells.length - 1,
    };
    const next = to[event.key];
    if (next === undefined || at < 0) return;
    event.preventDefault();
    cells[Math.min(cells.length - 1, Math.max(0, next))]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={c.label}
      data-slot="color-picker-swatches"
      {...rest}
      ref={grid}
      className={cx("fg-color-grid", className)}
      style={{ gridTemplateColumns: `repeat(${c.columns}, 24px)`, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        move(event);
      }}
    >
      {children ??
        c.palette.map((p) => <ColorPickerSwatch key={p.value} value={p.value} label={p.label} />)}
    </div>
  );
}

export type ColorPickerSwatchProps = Omit<
  ComponentProps<"button">,
  "value" | "type" | "role" | "children"
> & {
  /** `#RRGGBB`. */
  value: string;
  /** Said to assistive technology and shown as the tooltip. Default: its name in the palette. */
  label?: string;
};

/** One square. Chosen with a click, Enter or Space. */
export function ColorPickerSwatch({
  value,
  label,
  className,
  style,
  onClick,
  ...rest
}: ColorPickerSwatchProps) {
  const c = useColor();
  const on = value === c.value;
  const name = label ?? c.palette.find((p) => p.value === value)?.label ?? value;
  // The tab stop: the chosen square, else the first of the palette.
  const known = c.palette.some((p) => p.value === c.value);
  const stop = on || (!known && value === c.palette[0]?.value);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${name}, ${value}`}
      title={name}
      tabIndex={stop ? 0 : -1}
      data-slot="color-picker-swatch"
      {...rest}
      className={cx("fg-color-cell", on && "fg-color-on", className)}
      style={{ background: value, ...style }}
      onClick={(event) => {
        onClick?.(event);
        c.setTyped(null);
        c.setValue(value);
      }}
    />
  );
}

/** The field to type any hex code: it picks as soon as the code is whole. */
export function ColorPickerInput({
  className,
  children = "Hex",
  ...rest
}: Omit<ComponentProps<"input">, "value" | "onChange" | "children"> & { children?: ReactNode }) {
  const c = useColor();
  const shown = c.typed ?? c.value ?? "";
  const bad = c.typed !== null && c.typed !== "" && normalizeHex(c.typed) === null;
  return (
    <label className="fg-color-hex">
      <span className="fg-field-label">{children}</span>
      <input
        className={cx("fg-input fg-input-mono", className)}
        placeholder="#RRGGBB"
        spellCheck={false}
        aria-invalid={bad || undefined}
        maxLength={7}
        data-slot="color-picker-input"
        {...rest}
        value={shown}
        onChange={(event) => {
          const text = event.target.value;
          c.setTyped(text);
          const hexed = normalizeHex(text);
          if (hexed && text.replace("#", "").length >= 3) c.setValue(hexed);
        }}
        onBlur={(event) => {
          rest.onBlur?.(event);
          c.setTyped(null);
        }}
      />
    </label>
  );
}

/** The button that removes the colour. Draws nothing while there is none. */
export function ColorPickerClear({
  children = "Remove colour",
  className,
  onClick,
  ...rest
}: Omit<ComponentProps<"button">, "type">) {
  const c = useColor();
  if (!c.value) return null;
  return (
    <button
      type="button"
      data-slot="color-picker-clear"
      {...rest}
      className={cx("fg-range-preset", className)}
      onClick={(event) => {
        onClick?.(event);
        c.setTyped(null);
        c.setValue(null);
      }}
    >
      <Icon icon={Cancel01Icon} size={12} variant="mono" />
      {children}
    </button>
  );
}

/** A colour: a button with a square of it, and behind it the palette and a hex field. */
export function ColorPicker({
  label,
  hex = true,
  clearable = true,
  inline,
  className,
  children,
  ...rest
}: ColorPickerProps) {
  const panel = (
    <ColorPickerPanel>
      <ColorPickerSwatches />
      {hex ? <ColorPickerInput /> : null}
      {clearable ? <ColorPickerClear /> : null}
    </ColorPickerPanel>
  );
  return (
    <ColorPickerRoot {...rest} label={label} {...(inline ? { inline: true, className } : {})}>
      {inline ? (
        panel
      ) : (
        <>
          <ColorPickerTrigger {...(className ? { className } : {})}>{children}</ColorPickerTrigger>
          <ColorPickerContent>{panel}</ColorPickerContent>
        </>
      )}
    </ColorPickerRoot>
  );
}
