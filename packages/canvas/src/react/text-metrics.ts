// The metrics of the fonts the DOM uses, read from the browser: one set per document, shared by
// the GPU layer (where it puts each glyph) and the editors (where their texts wrap), so both agree
// with each other and with the DOM. Advances and kerning come from a 2D canvas (the DOM's shaper),
// the baseline from a line box laid out by the DOM. When a web font finishes loading, the caches
// are dropped and the subscribers told: what was laid out with a fallback font is laid out again.

import type { FarFont, FarTextMetrics } from "../core/text";

export interface BrowserTextMetrics extends FarTextMetrics {
  /** The CSS font of `font` at `px` pixels (its world size by default). */
  css(font: FarFont, px?: number): string;
  /** Changes when a font has loaded since: layouts made before are stale. */
  readonly version: number;
  subscribe(listener: () => void): () => void;
}

const byDocument = new WeakMap<Document, BrowserTextMetrics | null>();

/**
 * The metrics of the document of `el`, its families read from `--font-sans` and `--font-mono` on
 * `el`; null without a 2D canvas (a test's DOM).
 */
export function textMetrics(el: Element): BrowserTextMetrics | null {
  const doc = el.ownerDocument;
  if (byDocument.has(doc)) return byDocument.get(doc) ?? null;
  const made = create(el);
  byDocument.set(doc, made);
  return made;
}

function create(el: Element): BrowserTextMetrics | null {
  const doc = el.ownerDocument;
  const win = doc.defaultView;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = doc.createElement("canvas").getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx || typeof ctx.measureText !== "function") return null;
  const m = ctx;
  const style = win?.getComputedStyle(el);
  const families = {
    sans: style?.getPropertyValue("--font-sans").trim() || "ui-sans-serif, system-ui, sans-serif",
    mono: style?.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace",
  };
  const css = (font: FarFont, px = font.size) =>
    `${font.weight ?? 400} ${px}px ${font.family === "mono" ? families.mono : families.sans}`;

  // One record per font (size, family, weight), found without building a string: the layout asks
  // for advances and kerning by the tens of thousands.
  interface Rec {
    css: string;
    advances: Map<string, number>;
    kerns: Map<string, Map<string, number>>;
    baselines: Map<number, number>;
  }
  let recs = new Map<number, Array<Rec | undefined>>();
  let current = "";
  const use = (font: string) => {
    if (font !== current) {
      m.font = font;
      current = font;
    }
  };
  const rec = (font: FarFont): Rec => {
    let bySize = recs.get(font.size);
    if (!bySize) recs.set(font.size, (bySize = []));
    const i = Math.round((font.weight ?? 400) / 100) * 2 + (font.family === "mono" ? 1 : 0);
    let r = bySize[i];
    if (!r) {
      const f = css(font);
      ensure(f);
      r = bySize[i] = { css: f, advances: new Map(), kerns: new Map(), baselines: new Map() };
    }
    return r;
  };

  const listeners = new Set<() => void>();
  let version = 0;
  const invalidate = () => {
    recs = new Map();
    current = "";
    version++;
    for (const l of [...listeners]) l();
  };
  const fonts = doc.fonts as FontFaceSet | undefined;
  const asked = new Set<string>();
  // A web font is drawn only once loaded: ask for it, and lay out again when it is there.
  const ensure = (font: string) => {
    if (!fonts || asked.has(font)) return;
    asked.add(font);
    try {
      if (fonts.check(font)) return;
      // Its `loadingdone` lays out again.
      void fonts.load(font).catch(() => undefined);
    } catch {
      // A family the set cannot parse: the fallback stands.
    }
  };

  const width = (font: string, s: string) => {
    use(font);
    return m.measureText(s).width;
  };
  const advance = (font: FarFont, cluster: string) => {
    const r = rec(font);
    let w = r.advances.get(cluster);
    if (w === undefined) {
      w = width(r.css, cluster);
      r.advances.set(cluster, w);
    }
    return w;
  };
  const kern = (font: FarFont, a: string, b: string) => {
    if (a === " " && b === " ") return 0;
    const r = rec(font);
    let row = r.kerns.get(a);
    if (!row) r.kerns.set(a, (row = new Map()));
    let k = row.get(b);
    if (k === undefined) {
      k = width(r.css, a + b) - advance(font, a) - advance(font, b);
      if (Math.abs(k) < 1e-4) k = 0;
      row.set(b, k);
    }
    return k;
  };
  const baseline = (font: FarFont, lineHeight: number) => {
    const r = rec(font);
    let b = r.baselines.get(lineHeight);
    if (b === undefined) {
      b = probeBaseline(doc, r.css, lineHeight) ?? fromMetrics(r.css, lineHeight);
      r.baselines.set(lineHeight, b);
    }
    return b;
  };
  // Without a laid-out page: half the leading above the font's ascent, as CSS puts it.
  const fromMetrics = (f: string, lineHeight: number) => {
    use(f);
    const t = m.measureText("x");
    const ascent = Math.round(t.fontBoundingBoxAscent ?? 0);
    const descent = Math.round(t.fontBoundingBoxDescent ?? 0);
    return ascent + Math.floor((lineHeight - ascent - descent) / 2);
  };
  if (fonts && typeof fonts.addEventListener === "function") {
    fonts.addEventListener("loadingdone", () => invalidate());
  }

  return {
    advance,
    kern,
    baseline,
    css,
    get version() {
      return version;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The baseline of a line box laid out by the DOM: a zero-sized inline block sits on it. */
function probeBaseline(doc: Document, font: string, lineHeight: number): number | null {
  const host = doc.body;
  if (!host) return null;
  const box = doc.createElement("div");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;font:${font};line-height:${lineHeight}px`;
  const mark = doc.createElement("span");
  mark.style.cssText = "display:inline-block;width:0;height:0";
  box.append("x", mark);
  host.append(box);
  const top = box.getBoundingClientRect().top;
  const at = mark.getBoundingClientRect().top - top;
  const h = box.getBoundingClientRect().height;
  box.remove();
  return h > 0 ? at : null;
}
