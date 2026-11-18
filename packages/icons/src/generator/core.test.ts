import { describe, expect, it } from "vitest";
import { buildManifest, exportName, generate, renderFiles, shardOf } from "./core";
import { categoryOf, variantOf, wordsOf } from "./taxonomy";

const pixel = (name: string, duo = false) => ({ name, style: "pixel" as const, duo });
const DRAWN = [pixel("1st-bracket"), pixel("anvil", true), pixel("rows-2"), pixel("rows2")];

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
    drawn: [...DRAWN, pixel("arrow-down-01"), pixel("forgeron")],
    aliases: { "first-bracket": "1st-bracket" },
    curated: { forgeron: { category: "brands", description: "Our mark.", aliases: ["mark"] } },
  });
  const entry = (name: string) => manifest.find((e) => e.name === name);

  it("lists the drawn icons, sorted", () => {
    expect(manifest.map((e) => e.name)).toEqual([
      "1st-bracket",
      "anvil",
      "arrow-down-01",
      "forgeron",
      "rows-2",
      "rows2",
    ]);
  });

  it("gives each entry its variants, style and curated data", () => {
    expect(entry("anvil")).toMatchObject({ variants: { mono: true, duo: true }, style: "pixel" });
    expect(entry("forgeron")).toMatchObject({
      variants: { mono: true, duo: false },
      category: "brands",
      description: "Our mark.",
      aliases: ["mark"],
    });
  });

  it("files the aliases under their name", () => {
    expect(entry("1st-bracket")?.aliases).toEqual(["first-bracket"]);
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

  it("refuses an unknown curated category, an alias that is a name or leads nowhere", () => {
    expect(() =>
      buildManifest({ drawn: DRAWN, aliases: {}, curated: { anvil: { category: "nope" } } }),
    ).toThrow(/unknown category/);
    expect(() =>
      buildManifest({ drawn: DRAWN, aliases: {}, curated: { anvil: { aliases: ["rows2"] } } }),
    ).toThrow(/is a name/);
    expect(() =>
      buildManifest({ drawn: DRAWN, curated: {}, aliases: { lost: "nowhere" } }),
    ).toThrow(/not a name/);
  });
});

describe("renderFiles", () => {
  const input = { drawn: [pixel("1st-bracket"), pixel("anvil", true)], curated: {}, aliases: {} };

  it("re-exports drawn icons, one shard per first letter", () => {
    const { files } = generate(input);
    expect(Object.keys(files).sort()).toEqual([
      "icons-0-9.ts",
      "icons-a.ts",
      "index.ts",
      "manifest.json",
      "names.ts",
    ]);
    expect(files["icons-a.ts"]).toContain('export { default as AnvilIcon } from "../drawn/anvil";');
    expect(files["index.ts"]).toContain('export * from "./icons-0-9";');
    expect(files["names.ts"]).toContain('| "1st-bracket"');
    expect(JSON.parse(files["manifest.json"] ?? "")).toHaveLength(2);
  });

  it("copies the drawing of a name drawn as another icon, under its own name", () => {
    const drawn = [{ ...pixel("anvil", true), grid: 12, rows: ["", ".##"] }];
    const { manifest, files } = generate({ ...input, drawn, sameAs: { "arrow-down-01": "anvil" } });
    expect(files["icons-a.ts"]).toContain(
      'export const ArrowDown01Icon: PixelIcon = { name: "arrow-down-01", style: "pixel", grid: 12, rows: ["", ".##"] };',
    );
    expect(files["icons-a.ts"]).toContain('import type { PixelIcon } from "../types";');
    const entry = manifest.find((e) => e.name === "arrow-down-01");
    expect(entry).toMatchObject({ sameAs: "anvil", variants: { duo: true } });
    expect(manifest.find((e) => e.name === "anvil")?.sameAs).toBeNull();
    expect(() => generate({ ...input, drawn, sameAs: { "arrow-down-01": "rows-2" } })).toThrow(
      /not drawn/,
    );
    expect(() => generate({ ...input, drawn, sameAs: { anvil: "anvil" } })).toThrow(
      /has its own drawing/,
    );
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
