import { categories, manifest } from "@forgeron/icons/catalog";
import { useEffect, useMemo, useRef, useState } from "react";
import { ASH, EMBER, noise, planCells } from "../lib/pixels";
import { countByCategory, type CategoryCount } from "../lib/search";
import { squarify, type TreemapRect } from "../lib/treemap";

// The coverage map: one rectangle per category, its area by its number of icons, filled with small
// squares like a contribution graph; the share of ember squares is the share of icons drawn.

const TOTALS = countByCategory(manifest, categories);
const TOTAL = manifest.length;
const GAP = 4;
const LABEL = 26;

const pct = (c: CategoryCount) => `${((c.done / c.total) * 100).toFixed(1)}%`;

interface Layout {
  width: number;
  height: number;
  cell: number;
  rects: TreemapRect<CategoryCount>[];
}

function layoutFor(width: number): Layout {
  const height = Math.round(width < 640 ? width * 1.6 : width * 0.58);
  const rects = squarify(
    TOTALS.map((c) => ({ value: c.total, data: c })),
    width,
    height,
  );
  // One square per icon when the map holds them all, with room for the gaps and labels.
  const cell = Math.max(4, Math.min(14, Math.floor(Math.sqrt((width * height) / (TOTAL * 1.6)))));
  return { width, height, cell, rects };
}

function draw(canvas: HTMLCanvasElement, layout: Layout, hover: string | null): void {
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  canvas.width = layout.width * dpr;
  canvas.height = layout.height * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = layout.cell * dpr;
  const square = cell - Math.max(1, Math.round(dpr * (layout.cell >= 8 ? 2 : 1)));

  layout.rects.forEach((r, k) => {
    const x0 = Math.round((r.x + GAP / 2) * dpr);
    const y0 = Math.round((r.y + GAP / 2) * dpr);
    const w = Math.round((r.w - GAP) * dpr);
    const h = Math.round((r.h - GAP) * dpr);
    if (w <= 0 || h <= 0) return;
    const hot = hover === r.data.id;
    // The frame of the category.
    ctx.fillStyle = hot ? "#ff4f1f" : "#2e2e2e";
    ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = hot ? "#120804" : "#0a0a0a";
    ctx.fillRect(x0 + dpr, y0 + dpr, w - 2 * dpr, h - 2 * dpr);

    const label = r.h - GAP > LABEL * 2.2 ? LABEL * dpr : 0;
    const pad = 6 * dpr;
    const innerW = w - 2 * pad;
    const innerH = h - 2 * pad - label;
    const plan = planCells(innerW, innerH, cell, r.data.total, r.data.done);
    const ox = x0 + pad + Math.floor((innerW - plan.cols * cell) / 2);
    const oy = y0 + pad + label;
    for (let i = 0; i < plan.cells; i++) {
      const cx = i % plan.cols;
      const cy = Math.floor(i / plan.cols);
      const n = noise(cx, cy, k + 1);
      ctx.fillStyle =
        i < plan.filled
          ? (EMBER[1 + Math.floor(n * (EMBER.length - 1))] ?? EMBER[3])
          : (ASH[Math.floor(n * ASH.length)] ?? ASH[0]);
      ctx.fillRect(ox + cx * cell, oy + cy * cell, square, square);
    }
  });
}

export default function Coverage() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const layout = useMemo(() => (width > 0 ? layoutFor(width) : null), [width]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e?.contentRect.width ?? 0)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (layout && canvas.current) draw(canvas.current, layout, hover);
  }, [layout, hover]);

  return (
    <div className="cov">
      <div ref={box} className="cov-map" style={{ height: layout?.height ?? 480 }}>
        <canvas
          ref={canvas}
          aria-hidden="true"
          style={{ width: layout?.width ?? 0, height: layout?.height ?? 0 }}
        />
        {layout?.rects.map((r) => {
          const big = r.h - GAP > LABEL * 2.2;
          return (
            <a
              key={r.data.id}
              href={`/?category=${r.data.id}`}
              className={big ? "cov-cell" : "cov-cell is-small"}
              style={{
                left: r.x + GAP / 2,
                top: r.y + GAP / 2,
                width: r.w - GAP,
                height: r.h - GAP,
              }}
              onMouseEnter={() => setHover(r.data.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(r.data.id)}
              onBlur={() => setHover(null)}
              aria-label={`${r.data.label}: ${r.data.done} of ${r.data.total} icons drawn (${pct(r.data)}). Open in the gallery.`}
            >
              {big ? (
                <span className="cov-label t-mono">
                  <span className="cov-name">{r.data.label}</span>
                  <span className="dim">
                    <span className={r.data.done > 0 ? "accent" : undefined}>{r.data.done}</span>/
                    {r.data.total}
                  </span>
                </span>
              ) : null}
            </a>
          );
        })}
        {hover && layout
          ? (() => {
              const c = TOTALS.find((t) => t.id === hover);
              return c ? (
                <div className="cov-tip t-mono" role="status">
                  <b>{c.label}</b> · {c.done} / {c.total} drawn · {pct(c)}
                </div>
              ) : null;
            })()
          : null}
      </div>
      <div className="cov-legend t-mono dim">
        <span>
          <i className="sw" style={{ background: EMBER[3] }} /> drawn
        </span>
        <span>
          <i className="sw" style={{ background: ASH[2] }} /> stub
        </span>
        <span>Area ∝ icons per category · one square ≈ one icon · click a category to open it</span>
      </div>
    </div>
  );
}
