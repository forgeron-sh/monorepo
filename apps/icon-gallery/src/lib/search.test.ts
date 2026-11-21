import { describe, expect, it } from "vitest";
import {
  countByCategory,
  EMPTY_QUERY,
  filterEntries,
  queryFromSearch,
  searchFromQuery,
  searchScore,
} from "./search";

const entry = (name: string, category: string, labels: string[] = [], aliases: string[] = []) => ({
  name,
  category,
  labels,
  aliases,
});

const entries = [
  entry("lock", "security", ["secure"]),
  entry("lock-key", "security"),
  entry("square-lock-01", "security"),
  entry("command-line", "development", [], ["cli"]),
  entry("arrow-down-01", "arrows", ["chevron"]),
  entry("mcp", "ai"),
];

describe("search", () => {
  it("ranks the exact name, then aliases, prefixes, words and labels", () => {
    expect(filterEntries(entries, { ...EMPTY_QUERY, text: "lock" }).map((e) => e.name)).toEqual([
      "lock",
      "lock-key",
      "square-lock-01",
    ]);
    expect(filterEntries(entries, { ...EMPTY_QUERY, text: "cli" })[0]?.name).toBe("command-line");
    expect(filterEntries(entries, { ...EMPTY_QUERY, text: "chevron" })[0]?.name).toBe(
      "arrow-down-01",
    );
  });

  it("needs every term to match", () => {
    expect(searchScore(entries[1]!, "lock key")).toBeGreaterThan(0);
    expect(searchScore(entries[0]!, "lock key")).toBe(0);
  });

  it("filters by category, sorted by name", () => {
    expect(filterEntries(entries, EMPTY_QUERY).map((e) => e.name)).toEqual([
      "arrow-down-01",
      "command-line",
      "lock",
      "lock-key",
      "mcp",
      "square-lock-01",
    ]);
    expect(filterEntries(entries, { ...EMPTY_QUERY, category: "security" })).toHaveLength(3);
  });

  it("counts per category in the given order, skipping empty ones", () => {
    const counts = countByCategory(entries, [
      { id: "security", label: "Security" },
      { id: "food", label: "Food" },
      { id: "ai", label: "AI" },
    ]);
    expect(counts).toEqual([
      { id: "security", label: "Security", total: 3 },
      { id: "ai", label: "AI", total: 1 },
    ]);
  });

  it("round-trips the query through the address bar", () => {
    const q = { text: "lock", category: "security", icon: "lock" };
    expect(searchFromQuery(q)).toBe("?q=lock&category=security&icon=lock");
    expect(queryFromSearch(searchFromQuery(q))).toEqual(q);
    expect(queryFromSearch("?status=drawn")).toEqual({ ...EMPTY_QUERY, icon: null });
    expect(searchFromQuery({ ...EMPTY_QUERY })).toBe("");
  });
});
