// A colour from a palette of squares, or typed as hex. No gradients, no sliders: the colours of
// the design system, and any other one by its code.

import { Popover } from "@base-ui/react/popover";
import { Cancel01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { useDisclosure } from "./hooks/use-disclosure";
import { Icon } from "./icon";

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
  children?: ReactNode;
}

interface PanelProps {
  label: string;
  value: string | null;
  onPick: (value: string | null) => void;
  palette: ReadonlyArray<ColorOption>;
  hex: boolean;
  clearable: boolean;
  columns: number;
}

function Panel({ label, value, onPick, palette, hex, clearable, columns }: PanelProps) {
  const [typed, setTyped] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const known = palette.findIndex((p) => p.value === value);
  const stop = known >= 0 ? known : 0;
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const cells = [...(grid.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const at = cells.indexOf(document.activeElement as HTMLButtonElement);
    const to: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: at + columns,
      ArrowUp: at - columns,
      Home: 0,
      End: cells.length - 1,
    };
    const next = to[event.key];
    if (next === undefined || at < 0) return;
    event.preventDefault();
    cells[Math.min(cells.length - 1, Math.max(0, next))]?.focus();
  };
  const shown = typed ?? value ?? "";
  const bad = typed !== null && typed !== "" && normalizeHex(typed) === null;
  return (
    <div className="fg-color-panel">
      <div
        ref={grid}
        role="radiogroup"
        aria-label={label}
        className="fg-color-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 24px)` }}
        onKeyDown={move}
      >
        {palette.map((p, i) => {
          const on = p.value === value;
          return (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${p.label}, ${p.value}`}
              title={p.label}
              tabIndex={i === stop ? 0 : -1}
              className={cx("fg-color-cell", on && "fg-color-on")}
              style={{ background: p.value }}
              onClick={() => {
                setTyped(null);
                onPick(p.value);
              }}
            ></button>
          );
        })}
      </div>
      {hex ? (
        <label className="fg-color-hex">
          <span className="fg-field-label">Hex</span>
          <input
            className="fg-input fg-input-mono"
            value={shown}
            placeholder="#RRGGBB"
            spellCheck={false}
            aria-invalid={bad || undefined}
            maxLength={7}
            onChange={(event) => {
              const text = event.target.value;
              setTyped(text);
              const hexed = normalizeHex(text);
              if (hexed && text.replace("#", "").length >= 3) onPick(hexed);
            }}
            onBlur={() => setTyped(null)}
          />
        </label>
      ) : null}
      {clearable && value ? (
        <button
          type="button"
          className="fg-range-preset"
          onClick={() => {
            setTyped(null);
            onPick(null);
          }}
        >
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
          Remove colour
        </button>
      ) : null}
    </div>
  );
}

/** A colour: a button with a square of it, and behind it the palette and a hex field. */
export function ColorPicker({
  label,
  value: valueProp,
  defaultValue = null,
  onChange,
  palette = COLOR_PALETTE,
  hex = true,
  clearable = true,
  inline,
  columns = 4,
  placeholder = "No colour",
  open: openProp,
  onOpenChange,
  disabled,
  className,
  children,
}: ColorPickerProps) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const panel = (
    <Panel
      label={label}
      value={value}
      onPick={setValue}
      palette={palette}
      hex={hex}
      clearable={clearable}
      columns={columns}
    />
  );
  if (inline) return <div className={cx("fg-color-inline", className)}>{panel}</div>;
  const name = value ? (palette.find((p) => p.value === value)?.label ?? value) : placeholder;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        className={cx("fg-selm-trigger fg-color-trigger", !value && "fg-selm-empty", className)}
        aria-label={`${label}: ${name}`}
      >
        {children ?? (
          <>
            <span
              className="fg-swatch-mark"
              style={value ? { background: value } : undefined}
              aria-hidden="true"
            />
            <span>{name}</span>
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
          <Popover.Popup className="fg-pop fg-color-pop" aria-label={label}>
            {panel}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
