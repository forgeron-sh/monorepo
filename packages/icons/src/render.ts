import type { IconDefinition, IconRenderOptions, PixelIcon } from "./types";

// One renderer for every output: `iconTree` builds a neutral element tree that `toSvg` prints and
// the React component maps to elements, so a copied SVG and a rendered icon never differ.

export interface SvgElement {
  readonly tag: string;
  readonly attrs: Readonly<Record<string, string | number>>;
  readonly style?: Readonly<Record<string, string | number>>;
  readonly children?: readonly SvgElement[];
  readonly text?: string;
}

const SECONDARY_COLOR = "var(--icon-secondary, currentColor)";
const SECONDARY_OPACITY = "var(--icon-secondary-opacity, 0.4)";

/** Whether the duotone variant differs from the monotone one. */
export function hasDuotone(icon: IconDefinition): boolean {
  return icon.rows.some((row) => row.includes("o"));
}

/** The rows of a pixel icon, each exactly `grid` characters long, `grid` rows. */
export function pixelRows(icon: PixelIcon): string[] {
  return Array.from({ length: icon.grid }, (_, y) =>
    (icon.rows[y] ?? "").padEnd(icon.grid, ".").slice(0, icon.grid),
  );
}

/** Path data of the pixels equal to `char`, one rectangle per horizontal run. */
function runs(rows: readonly string[], match: (char: string) => boolean): string {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!match(row[x] ?? "")) {
        x++;
        continue;
      }
      const start = x;
      while (x < row.length && match(row[x] ?? "")) x++;
      const w = x - start;
      d += `M${start} ${y}h${w}v1h-${w}z`;
    }
  });
  return d;
}

function secondaryPaint(options: IconRenderOptions): { color: string; opacity: string | number } {
  const color = options.secondaryColor ?? SECONDARY_COLOR;
  const opacity =
    options.secondaryOpacity ?? (options.secondaryColor === undefined ? SECONDARY_OPACITY : 1);
  return { color, opacity };
}

function shapes(icon: IconDefinition, options: IconRenderOptions): SvgElement[] {
  const color = options.color ?? "currentColor";
  const rows = pixelRows(icon);
  if (options.variant !== "duo") {
    const d = runs(rows, (c) => c === "#" || c === "o");
    return d ? [{ tag: "path", attrs: { fill: color, d } }] : [];
  }
  const second = secondaryPaint(options);
  const out: SvgElement[] = [];
  const ink = runs(rows, (c) => c === "#");
  const signal = runs(rows, (c) => c === "o");
  if (ink) out.push({ tag: "path", attrs: { fill: color, d: ink } });
  if (signal) {
    out.push({
      tag: "path",
      attrs: { d: signal },
      style: { fill: second.color, opacity: second.opacity },
    });
  }
  return out;
}

/** The `<svg>` element of an icon. */
export function iconTree(icon: IconDefinition, options: IconRenderOptions = {}): SvgElement {
  const size = options.size ?? 24;
  const attrs: Record<string, string | number> = {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: `0 0 ${icon.grid} ${icon.grid}`,
    "shape-rendering": "crispEdges",
  };
  const children = shapes(icon, options);
  if (options.title) {
    attrs.role = "img";
    attrs["aria-label"] = options.title;
    return {
      tag: "svg",
      attrs,
      children: [{ tag: "title", attrs: {}, text: options.title }, ...children],
    };
  }
  attrs["aria-hidden"] = "true";
  return { tag: "svg", attrs, children };
}

const escape = (value: string | number) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

function print(el: SvgElement): string {
  let attrs = Object.entries(el.attrs)
    .map(([k, v]) => ` ${k}="${escape(v)}"`)
    .join("");
  if (el.style) {
    const css = Object.entries(el.style)
      .map(([k, v]) => `${k}:${v}`)
      .join(";");
    attrs += ` style="${escape(css)}"`;
  }
  const inner = el.text !== undefined ? escape(el.text) : (el.children ?? []).map(print).join("");
  return inner ? `<${el.tag}${attrs}>${inner}</${el.tag}>` : `<${el.tag}${attrs}/>`;
}

/** The icon as SVG markup. */
export function toSvg(icon: IconDefinition, options: IconRenderOptions = {}): string {
  const tree = iconTree(icon, options);
  return print(tree);
}
