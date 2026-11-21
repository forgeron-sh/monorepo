import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSpecimen } from "./specimen";

const dir = fileURLToPath(new URL("../../public/fonts/", import.meta.url));
const { specimen, archive } = loadSpecimen(dir);

describe("loadSpecimen", () => {
  it("describes three weights with their grid and pixel-perfect step", () => {
    expect(specimen.weights.map((w) => [w.style, w.unit, w.step])).toEqual([
      ["Regular", 100, 10],
      ["Medium", 50, 20],
      ["Bold", 100, 10],
    ]);
  });

  it("counts every mapped character once, in groups that add up", () => {
    const grouped = specimen.groups.reduce((n, g) => n + g.cps.length, 0);
    expect(grouped).toBe(specimen.codepoints.length);
    expect(specimen.glyphCount).toBe(specimen.codepoints.length + 1); // + .notdef
    expect(specimen.groups.find((g) => g.group === "uppercase")?.cps.length).toBe(26);
  });

  it("rasterises every character over the full line, ascender to descender", () => {
    const regular = specimen.weights[0]!;
    for (const cp of specimen.codepoints) expect(regular.bitmaps[cp]).toHaveLength(11);
    expect(specimen.weights[1]!.bitmaps[0x41]).toHaveLength(22);
  });

  it("lists the files with sizes and SHA-256, and an archive that holds them and the licence", () => {
    expect(specimen.files.map((f) => f.name)).toEqual([
      "ForgeronSans-Regular.otf",
      "ForgeronSans-Medium.otf",
      "ForgeronSans-Bold.otf",
    ]);
    for (const f of specimen.files) {
      expect(f.bytes).toBeGreaterThan(1000);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(specimen.archive.name).toBe("ForgeronSans-0.1.zip");
    expect(specimen.archive.bytes).toBe(archive.length);
    const text = new TextDecoder("latin1").decode(archive);
    expect(text).toContain("ForgeronSans-0.1/ForgeronSans-Bold.otf");
    expect(text).toContain("ForgeronSans-0.1/OFL.txt");
    expect(text).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(text).toContain("Copyright (c) 2026 forgeron.sh");
  });
});
