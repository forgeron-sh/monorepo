import type { IconManifestEntry } from "../types";
import { CATEGORIES } from "./taxonomy";

export interface CategoryCoverage {
  readonly id: string;
  readonly label: string;
  readonly total: number;
  readonly done: number;
  readonly missing: number;
}

/** Done and missing icons per category, largest category first, with the overall total last. */
export function coverage(manifest: readonly IconManifestEntry[]): CategoryCoverage[] {
  const rows = CATEGORIES.map((c) => {
    const entries = manifest.filter((e) => e.category === c.id);
    const done = entries.filter((e) => e.implemented).length;
    return {
      id: c.id,
      label: c.label,
      total: entries.length,
      done,
      missing: entries.length - done,
    };
  })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
  const done = manifest.filter((e) => e.implemented).length;
  return [
    ...rows,
    { id: "all", label: "All", total: manifest.length, done, missing: manifest.length - done },
  ];
}

const pct = (done: number, total: number) =>
  total === 0 ? "0.0%" : `${((done / total) * 100).toFixed(1)}%`;

/** The coverage as a plain-text table. */
export function coverageTable(rows: readonly CategoryCoverage[]): string {
  const head = ["category", "total", "done", "missing", "done %"];
  const body = rows.map((r) => [
    r.id,
    `${r.total}`,
    `${r.done}`,
    `${r.missing}`,
    pct(r.done, r.total),
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i]?.length ?? 0)));
  const line = (cells: readonly string[]) =>
    cells
      .map((c, i) => (i === 0 ? c.padEnd(widths[i] ?? 0) : c.padStart(widths[i] ?? 0)))
      .join("  ");
  return [line(head), line(widths.map((w) => "-".repeat(w))), ...body.map(line)].join("\n");
}
