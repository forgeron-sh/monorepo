import { describe, expect, it } from "vitest";
import { bakedFieldModule, bakeField, bakeProgram } from "./bake";
import { bindChain } from "./contract";
import * as baked from "./field.baked";
import { gridGlsl } from "./passes/grid.glsl";
import { orderedGlsl } from "./passes/ordered.glsl";
import { paletteGlsl } from "./passes/palette.glsl";
import { pixelateStep } from "./passes/pixelate";
import { fieldPreset } from "./presets";
import { FIELD_MODES, type FieldMode } from "./sources/field";
import { fieldGlsl } from "./sources/field.glsl";

const glslOf = (mode: FieldMode, accent: boolean, pixel?: number) =>
  bakeProgram(
    bindChain(
      fieldPreset({
        mode,
        accent,
        pixel,
        tones: ["#000", { var: "--x", fallback: "#123456" }, "--y"],
      }),
      { field: fieldGlsl },
      { pixelate: pixelateStep, ordered: orderedGlsl, grid: gridGlsl, palette: paletteGlsl },
    ),
  ).fragment;

describe("GLSL compiled ahead of time", () => {
  it("field.baked.ts is what the generators compile (run `bun scripts/shaders/bake.ts`)", () => {
    const f = bakeField();
    expect(baked.FIELD_FRAGMENT).toBe(f.accent);
    expect(baked.FIELD_FRAGMENT_INK).toBe(f.ink);
    expect(baked.FIELD_MODE_UNIFORM).toBe("uMode");
    expect(baked.FIELD_TONES_UNIFORM).toBe(f.tones);
    expect(bakedFieldModule()).toContain(JSON.stringify(f.accent));
  });

  it("the field's text depends on the accent only: modes, tones and cells are uniforms", () => {
    for (const mode of Object.keys(FIELD_MODES) as FieldMode[]) {
      expect(glslOf(mode, true, 8)).toBe(baked.FIELD_FRAGMENT);
      expect(glslOf(mode, false, 5)).toBe(baked.FIELD_FRAGMENT_INK);
    }
  });

  it("a chain of several stages is not baked", () => {
    expect(() =>
      bakeProgram(
        bindChain(
          { version: 1, source: { type: "field", mode: "ember" }, passes: [{ type: "x" }] },
          { field: fieldGlsl },
          { x: { type: "x", kind: "neighbourhood", glsl: () => ({ decl: [], body: "" }) } },
        ),
      ),
    ).toThrow(/one stage/);
  });
});
