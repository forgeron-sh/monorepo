import type { GalleryEntry } from "./loader";

// The gallery's view of the catalog: what the sidebar, the search bar and the grid ask of it.

export interface GalleryQuery {
  readonly text: string;
  readonly category: string | null;
}

export const EMPTY_QUERY: GalleryQuery = { text: "", category: null };

type Searchable = Pick<GalleryEntry, "name" | "category" | "labels" | "aliases">;

/** How well an entry matches one search term; 0 when it does not. */
function termScore(entry: Searchable, term: string): number {
  if (entry.name === term) return 100;
  if (entry.aliases.includes(term)) return 90;
  if (entry.name.startsWith(term)) return 70;
  if (entry.name.split("-").includes(term)) return 60;
  if (entry.name.includes(term)) return 40;
  if (entry.labels.some((l) => l === term)) return 30;
  if (entry.aliases.some((a) => a.includes(term))) return 25;
  if (entry.labels.some((l) => l.startsWith(term))) return 20;
  return 0;
}

/** The score of an entry for a whole search: every term must match. */
export function searchScore(entry: Searchable, text: string): number {
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

/** The entries a query keeps, best match first, then by name. */
export function filterEntries<T extends Searchable>(
  entries: readonly T[],
  query: GalleryQuery,
): T[] {
  const scored: { entry: T; score: number }[] = [];
  for (const entry of entries) {
    if (query.category && entry.category !== query.category) continue;
    const score = searchScore(entry, query.text);
    if (score > 0) scored.push({ entry, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .map((s) => s.entry);
}

export interface CategoryCount {
  readonly id: string;
  readonly label: string;
  readonly total: number;
}

/** Totals per category, in the order of `categories`. */
export function countByCategory(
  entries: readonly Pick<GalleryEntry, "category">[],
  categories: readonly { id: string; label: string }[],
): CategoryCount[] {
  const totals = new Map<string, number>();
  for (const entry of entries) totals.set(entry.category, (totals.get(entry.category) ?? 0) + 1);
  return categories
    .map((c) => ({ id: c.id, label: c.label, total: totals.get(c.id) ?? 0 }))
    .filter((c) => c.total > 0);
}

/** The query in the address bar, so a search, a category or an icon can be linked. */
export function queryFromSearch(search: string): GalleryQuery & { icon: string | null } {
  const params = new URLSearchParams(search);
  return {
    text: params.get("q") ?? "",
    category: params.get("category"),
    icon: params.get("icon"),
  };
}

export function searchFromQuery(query: GalleryQuery & { icon?: string | null }): string {
  const params = new URLSearchParams();
  if (query.text) params.set("q", query.text);
  if (query.category) params.set("category", query.category);
  if (query.icon) params.set("icon", query.icon);
  const s = params.toString();
  return s ? `?${s}` : "";
}
