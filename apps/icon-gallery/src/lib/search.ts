import type { IconManifestEntry } from "@forgeron/icons";

// The gallery's view of the catalog: what the sidebar, the search bar and the grid ask of it.

export type StatusFilter = "all" | "drawn" | "stub";
export type SourceFilter = "all" | "hugeicons" | "forgeron";

export interface GalleryQuery {
  readonly text: string;
  readonly category: string | null;
  readonly status: StatusFilter;
  readonly source: SourceFilter;
}

export const EMPTY_QUERY: GalleryQuery = { text: "", category: null, status: "all", source: "all" };

/** How well an entry matches one search term; 0 when it does not. */
function termScore(entry: IconManifestEntry, term: string): number {
  if (entry.name === term) return 100;
  if (entry.aliases.includes(term)) return 90;
  if (entry.name.startsWith(term)) return 70;
  if (entry.name.split("-").includes(term)) return 60;
  if (entry.name.includes(term)) return 40;
  if (entry.labels.some((l) => l === term)) return 30;
  if (entry.aliases.some((a) => a.includes(term))) return 25;
  if (entry.labels.some((l) => l.startsWith(term))) return 20;
  if (entry.description.toLowerCase().includes(term)) return 5;
  return 0;
}

/** The score of an entry for a whole search: every term must match. */
export function searchScore(entry: IconManifestEntry, text: string): number {
  const terms = text
    .toLowerCase()
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (terms.length === 0) return 1;
  let total = 0;
  for (const term of terms) {
    const score = termScore(entry, term);
    if (score === 0) return 0;
    total += score;
  }
  return total;
}

/** The entries a query keeps, best match first when there is a search, drawn icons first otherwise. */
export function filterEntries(
  entries: readonly IconManifestEntry[],
  query: GalleryQuery,
): IconManifestEntry[] {
  const scored: { entry: IconManifestEntry; score: number }[] = [];
  for (const entry of entries) {
    if (query.category && entry.category !== query.category) continue;
    if (query.status === "drawn" && !entry.implemented) continue;
    if (query.status === "stub" && entry.implemented) continue;
    if (query.source !== "all" && entry.source !== query.source) continue;
    const score = searchScore(entry, query.text);
    if (score > 0) scored.push({ entry, score });
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.entry.implemented) - Number(a.entry.implemented) ||
        a.entry.name.localeCompare(b.entry.name),
    )
    .map((s) => s.entry);
}

export interface CategoryCount {
  readonly id: string;
  readonly label: string;
  readonly total: number;
}

/** Totals per category, in the order of `categories`. */
export function countByCategory(
  entries: readonly IconManifestEntry[],
  categories: readonly { id: string; label: string }[],
): CategoryCount[] {
  const totals = new Map<string, number>();
  for (const entry of entries) totals.set(entry.category, (totals.get(entry.category) ?? 0) + 1);
  return categories
    .map((c) => ({ id: c.id, label: c.label, total: totals.get(c.id) ?? 0 }))
    .filter((c) => c.total > 0);
}

/** The query in the address bar, so a category of the coverage page links to its gallery. */
export function queryFromSearch(search: string): GalleryQuery & { icon: string | null } {
  const params = new URLSearchParams(search);
  const status = params.get("status");
  const source = params.get("source");
  return {
    text: params.get("q") ?? "",
    category: params.get("category"),
    status: status === "drawn" || status === "stub" ? status : "all",
    source: source === "hugeicons" || source === "forgeron" ? source : "all",
    icon: params.get("icon"),
  };
}

export function searchFromQuery(query: GalleryQuery & { icon?: string | null }): string {
  const params = new URLSearchParams();
  if (query.text) params.set("q", query.text);
  if (query.category) params.set("category", query.category);
  if (query.status !== "all") params.set("status", query.status);
  if (query.source !== "all") params.set("source", query.source);
  if (query.icon) params.set("icon", query.icon);
  const s = params.toString();
  return s ? `?${s}` : "";
}
