/**
 * The raster's SIMD kernels (`fg-blueprint-raster`'s `simd`: shading, paint, a face's runs) against
 * the scalar code they replace, under WebAssembly: native tests run the scalar code only, so the
 * test module runs the comparison itself (`simd_self_test`, docs/blueprint/engine.md, "SIMD and
 * size notes"). The golden suites then hold the frames of both modules to the same pixels.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { initSync, simd_self_test } from "../../wasm/debug/fg_blueprint.js";

describe("SIMD kernels", () => {
  it("match the scalar code on every generated case", () => {
    initSync({
      module: readFileSync(new URL("../../wasm/debug/fg_blueprint_bg.wasm", import.meta.url)),
    });
    expect(simd_self_test()).toBe(0);
  });
});
