import { describe, expect, it } from "vitest";
import { coverage, coverageTable } from "./audit";
import {
  buildManifest,
  exportName,
  generate,
  renderFiles,
  shardOf,
  type NameSnapshot,
} from "./core";
import { categoryOf, variantOf, wordsOf } from "./taxonomy";

const snapshot = (over: Partial<NameSnapshot> = {}): NameSnapshot => ({
  source: "test",
  fetchedAt: "2026-11-16T00:00:00.000Z",
  prefix: "hugeicons",
  total: 6,
  title: "Huge Icons",
  uncategorized: ["1st-bracket", "anvil", "arrow-down-01", "rows-2", "rows2", "withdrawn"],
  hidden: ["withdrawn", "first-bracket-circle"],
  aliases: { "first-bracket": "1st-bracket", "first-brecket": "first-bracket", lost: "nowhere" },
  ...over,
});

describe("exportName", () => {
  it.each([
    ["anvil", "AnvilIcon"],
    ["arrow-down-01", "ArrowDown01Icon"],
    ["1st-bracket", "FirstBracketIcon"],
    ["3d-move", "ThreeDMoveIcon"],
    ["24-hours-clock", "TwentyFourHoursClockIcon"],
    ["4k", "FourKIcon"],
    ["7z-01", "SevenZ01Icon"],
    ["sorting-1-9", "SortingOneNineIcon"],
    ["arrow-down-0-1", "ArrowDownZeroOneIcon"],
  ])("%s → %s", (name, id) => {
    expect(exportName(name)).toBe(id);
  });
});

describe("buildManifest", () => {
  const manifest = buildManifest({
    snapshot: snapshot(),
    drawn: [{ name: "anvil", style: "pixel", duo: true }],
    own: ["forgeron"],
    curated: { forgeron: { category: "brands", description: "Our mark.", aliases: ["mark"] } },
  });
  const entry = (name: string) => manifest.find((e) => e.name === name);

  it("lists the visible names and our own, without the hidden ones, sorted", () => {
    expect(manifest.map((e) => e.name)).toEqual([
      "1st-bracket",
      "anvil",
      "arrow-down-01",
      "forgeron",
      "rows-2",
      "rows2",
    ]);
  });

  it("flags drawn icons as implemented, with their variants and style", () => {
    expect(entry("anvil")).toMatchObject({
      implemented: true,
      variants: { mono: true, duo: true },
      style: "pixel",
      source: "hugeicons",
    });
    expect(entry("forgeron")).toMatchObject({
      implemented: false,
      variants: { mono: false, duo: false },
      style: null,
      source: "forgeron",
      category: "brands",
      description: "Our mark.",
      aliases: ["mark"],
    });
  });

  it("follows alias chains to a visible name and drops the dead ends", () => {
    expect(entry("1st-bracket")?.aliases).toEqual(["first-bracket", "first-brecket"]);
    expect(manifest.flatMap((e) => e.aliases)).not.toContain("lost");
  });

  it("keeps the plain export for the hyphenated name of a pair", () => {
    expect(entry("rows-2")?.export).toBe("Rows2Icon");
    expect(entry("rows2")?.export).toBe("Rows_2Icon");
  });

  it("derives labels and a description from the name", () => {
    const arrow = entry("arrow-down-01");
    expect(arrow?.category).toBe("arrows");
    expect(arrow?.labels).toEqual(expect.arrayContaining(["arrow", "down", "arrows"]));
    expect(arrow?.description).toBe("Arrow down, variant 01. Arrows.");
  });

  it("refuses a drawn icon that is neither a Hugeicons name nor our own", () => {
    expect(() =>
      buildManifest({
        snapshot: snapshot(),
        drawn: [{ name: "typo", style: "pixel", duo: false }],
        own: [],
      }),
    ).toThrow(/neither a Hugeicons name nor listed in OWN_ICONS/);
  });

  it("refuses an own name that Hugeicons already has", () => {
    expect(() => buildManifest({ snapshot: snapshot(), drawn: [], own: ["anvil"] })).toThrow(
      /is a Hugeicons name/,
    );
  });

  it("refuses an unknown curated category and an alias that is a name", () => {
    expect(() =>
      buildManifest({
        snapshot: snapshot(),
        drawn: [],
        own: [],
        curated: { anvil: { category: "nope" } },
      }),
    ).toThrow(/unknown category/);
    expect(() =>
      buildManifest({
        snapshot: snapshot(),
        drawn: [],
        own: [],
        curated: { anvil: { aliases: ["rows2"] } },
      }),
    ).toThrow(/is a name/);
  });
});

describe("renderFiles", () => {
  const input = {
    snapshot: snapshot(),
    drawn: [{ name: "anvil", style: "pixel" as const, duo: true }],
    own: [],
    curated: {},
  };

  it("re-exports drawn icons and writes stubs as plain data, one shard per first letter", () => {
    const { files } = generate(input);
    expect(Object.keys(files).sort()).toEqual([
      "icons-0-9.ts",
      "icons-a.ts",
      "icons-r.ts",
      "index.ts",
      "manifest.json",
      "names.ts",
    ]);
    expect(files["icons-a.ts"]).toContain('export { default as AnvilIcon } from "../drawn/anvil";');
    expect(files["icons-a.ts"]).toContain(
      'export const ArrowDown01Icon: StubIcon = { name: "arrow-down-01", implemented: false };',
    );
    expect(files["index.ts"]).toContain('export * from "./icons-0-9";');
    expect(files["names.ts"]).toContain('| "1st-bracket"');
    expect(JSON.parse(files["manifest.json"] ?? "")).toHaveLength(5);
  });

  it("is deterministic: the same input writes the same files", () => {
    expect(generate(input).files).toEqual(generate(input).files);
    const { manifest } = generate(input);
    expect(renderFiles(manifest)).toEqual(generate(input).files);
  });

  it("files a leading digit under 0-9", () => {
    expect(shardOf("3d-move")).toBe("0-9");
    expect(shardOf("zap")).toBe("z");
  });
});

describe("taxonomy", () => {
  it.each([
    ["arrow-down-01", "arrows"],
    ["square-lock-01", "security"],
    ["cloud-upload", "network"],
    ["cloud-angled-rain", "weather"],
    ["credit-card", "commerce"],
    ["github", "brands"],
    ["user-group", "users"],
    ["calendar-03", "time"],
    ["xyzzy", "general"],
  ])("%s → %s", (name, category) => {
    expect(categoryOf(name)).toBe(category);
  });

  it("splits names into words and variant numbers", () => {
    expect(wordsOf("arrow-down-01")).toEqual(["arrow", "down"]);
    expect(variantOf("arrow-down-01")).toBe("01");
    expect(variantOf("anvil")).toBeUndefined();
  });
});

describe("coverage", () => {
  it("counts done and missing per category, then overall", () => {
    const { manifest } = generate({
      snapshot: snapshot(),
      drawn: [{ name: "anvil", style: "pixel", duo: true }],
      own: [],
      curated: {},
    });
    const rows = coverage(manifest);
    expect(rows.at(-1)).toEqual({ id: "all", label: "All", total: 5, done: 1, missing: 4 });
    expect(rows.reduce((n, r) => (r.id === "all" ? n : n + r.total), 0)).toBe(5);
    expect(coverageTable(rows)).toMatch(/^category\s+total\s+done\s+missing\s+done %/);
  });
});
