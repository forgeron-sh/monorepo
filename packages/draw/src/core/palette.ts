// The colours of a board, from the tokens of the design system: an item stores a token id
// (`ink`, `accent`…) so it follows the theme, or a `#rrggbb` code for any other colour. The hex
// values are the dark theme's, for the colour pickers and for an export without a page to read.

import type { DrawColor, StickyColor } from "./types";

export interface PaletteColor {
  id: string;
  label: string;
  /** The CSS custom property it reads. */
  token: string;
  /** Its value in the dark theme, as ui's `COLOR_PALETTE` writes it. */
  hex: string;
}

export const DRAW_PALETTE: ReadonlyArray<PaletteColor> = [
  { id: "accent", label: "Ember", token: "--accent", hex: "#ff4f1f" },
  { id: "warning", label: "Amber", token: "--warning", hex: "#ffb020" },
  { id: "success", label: "Green", token: "--success", hex: "#3ddc84" },
  { id: "danger", label: "Rose", token: "--danger", hex: "#ff6b81" },
  { id: "ink", label: "White", token: "--ink", hex: "#ededed" },
  { id: "muted", label: "Grey", token: "--ink-muted", hex: "#8f8f8f" },
  { id: "dim", label: "Dim grey", token: "--ink-dim", hex: "#5e5e5e" },
  { id: "line", label: "Line grey", token: "--line-strong", hex: "#2e2e2e" },
];

/** Tokens a colour may also name without being offered in the palette (backgrounds). */
const EXTRA: ReadonlyArray<PaletteColor> = [
  { id: "bg", label: "Background", token: "--bg", hex: "#0a0a0a" },
  { id: "raised", label: "Raised", token: "--bg-raised", hex: "#111111" },
  { id: "sunk", label: "Sunk", token: "--bg-sunk", hex: "#050505" },
  { id: "warning-subtle", label: "Amber wash", token: "--warning-subtle", hex: "#2e2209" },
  { id: "success-subtle", label: "Green wash", token: "--success-subtle", hex: "#0f2a1b" },
  { id: "danger-subtle", label: "Rose wash", token: "--danger-subtle", hex: "#351419" },
];

const BY_ID = new Map([...DRAW_PALETTE, ...EXTRA].map((c) => [c.id, c]));

export const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

/** A colour as CSS: `var(--token)` for a token id, the code itself otherwise. */
export function colorCss(color: DrawColor | null | undefined): string {
  if (!color) return "none";
  const known = BY_ID.get(color);
  return known ? `var(${known.token})` : color;
}

/** A colour as a hex code, reading tokens from `resolve` (a page's computed style), else dark. */
export function colorHex(
  color: DrawColor | null | undefined,
  resolve?: (token: string) => string | undefined,
): string {
  if (!color) return "none";
  const known = BY_ID.get(color);
  if (!known) return color;
  return resolve?.(known.token)?.trim() || known.hex;
}

/** The hex code a colour picker shows for a colour. */
export const pickerValue = (color: DrawColor | null | undefined): string | null =>
  color ? (BY_ID.get(color)?.hex ?? color) : null;

/** A picked hex code back to a token id when it is one of the palette's. */
export function fromPicker(hex: string): DrawColor {
  const lower = hex.toLowerCase();
  return DRAW_PALETTE.find((c) => c.hex === lower)?.id ?? lower;
}

/** The colours of a sticky note: its paper and its edge. */
export const STICKY_COLORS: Readonly<
  Record<StickyColor, { label: string; paper: DrawColor; edge: DrawColor }>
> = {
  amber: { label: "Amber", paper: "warning-subtle", edge: "warning" },
  green: { label: "Green", paper: "success-subtle", edge: "success" },
  rose: { label: "Rose", paper: "danger-subtle", edge: "danger" },
  ember: { label: "Ember", paper: "raised", edge: "accent" },
  grey: { label: "Grey", paper: "raised", edge: "line" },
};

export const STICKY_ORDER: ReadonlyArray<StickyColor> = ["amber", "green", "rose", "ember", "grey"];

/** The 4 × 4 dither maps of a pattern fill, `1` a lit pixel; the same as ui's `FillPicker`. */
export const DRAW_PATTERNS: Readonly<Record<string, ReadonlyArray<string>>> = {
  "dots-25": ["1000", "0000", "0010", "0000"],
  "dots-50": ["1010", "0101", "1010", "0101"],
  "dots-75": ["0111", "1111", "1101", "1111"],
  "lines-h": ["1111", "0000", "1111", "0000"],
  "lines-v": ["1010", "1010", "1010", "1010"],
  hatch: ["1000", "0100", "0010", "0001"],
  "hatch-back": ["0001", "0010", "0100", "1000"],
  cross: ["1001", "0110", "0110", "1001"],
};

/** The lit cells of a pattern as `[column, row]`; empty for an unknown one. */
export function patternCells(id: string): Array<[number, number]> {
  const rows = DRAW_PATTERNS[id] ?? [];
  const out: Array<[number, number]> = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => c === "1" && out.push([x, y])));
  return out;
}

/** World units per pattern pixel: a pattern tile is 4 of them. */
export const PATTERN_PIXEL = 2;
