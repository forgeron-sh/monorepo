import type { IconManifestEntry } from "@forgeron/icons";
import { describe, expect, it } from "vitest";
import {
  countByCategory,
  EMPTY_QUERY,
  filterEntries,
  queryFromSearch,
  searchFromQuery,
  searchScore,
} from "./search";

const entry = (name: string, over: Partial<IconManifestEntry> = {}): IconManifestEntry => ({
  name,
  export: "X",
  source: "hugeicons",
  category: "interface",
  labels: name.split("-"),
  description: `${name}.`,
  implemented: false,
  variants: { mono: false, duo: false },
  style: null,
  aliases: [],
  reference: null,
  trademark: null,
  ...over,
});

const entries = [
  entry("lock", { category: "security", implemented: true, labels: ["lock", "secure"] }),
  entry("lock-key", { category: "security" }),
  entry("square-lock-01", { category: "security" }),
  entry("command-line", { category: "development", aliases: ["cli"], implemented: true }),
  entry("arrow-down-01", { category: "arrows", labels: ["arrow", "down", "chevron"] }),
  entry("mcp", { category: "ai", source: "forgeron" }),
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

  it("filters by category, status and source, drawn icons first", () => {
    const all = filterEntries(entries, EMPTY_QUERY).map((e) => e.name);
    expect(all.slice(0, 2)).toEqual(["command-line", "lock"]);
    expect(
      filterEntries(entries, { ...EMPTY_QUERY, category: "security", status: "stub" }),
    ).toHaveLength(2);
    expect(
      filterEntries(entries, { ...EMPTY_QUERY, source: "forgeron" }).map((e) => e.name),
    ).toEqual(["mcp"]);
    expect(filterEntries(entries, { ...EMPTY_QUERY, status: "drawn" })).toHaveLength(2);
  });

  it("counts per category in the given order, skipping empty ones", () => {
    const counts = countByCategory(entries, [
      { id: "security", label: "Security" },
      { id: "food", label: "Food" },
      { id: "ai", label: "AI" },
    ]);
    expect(counts).toEqual([
      { id: "security", label: "Security", total: 3, done: 1 },
      { id: "ai", label: "AI", total: 1, done: 0 },
    ]);
  });

  it("round-trips the query through the address bar", () => {
    const q = {
      text: "lock",
      category: "security",
      status: "drawn" as const,
      source: "all" as const,
      icon: "lock",
    };
    expect(searchFromQuery(q)).toBe("?q=lock&category=security&status=drawn&icon=lock");
    expect(queryFromSearch(searchFromQuery(q))).toEqual(q);
    expect(queryFromSearch("?status=nope")).toEqual({ ...EMPTY_QUERY, icon: null });
    expect(searchFromQuery({ ...EMPTY_QUERY })).toBe("");
  });
});
