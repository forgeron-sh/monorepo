import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { pixelate, renderSvg } from "../index";
import { cube } from "../examples/scenes";
import { Blueprint, Box, collect, Dither, Glow, Label, Line, Pixelate } from "./index";

describe("collect", () => {
  it("turns markers into blocks and filters, in order, through arrays and fragments", () => {
    const { blocks, filters } = collect([
      h(Box, { key: 1, at: [0, 0, 0], size: [2, 2, 2], accent: true }),
      h(
        Fragment,
        { key: 2 },
        h(Line, { a: [0, 0, 0], b: [4, 0, 0], ink: "dim" }),
        false,
        null,
        h(Label, { at: [1, 1, 3], text: "Repo" }),
      ),
      h(Pixelate, { key: 3, size: 3 }),
      h(Dither, { key: 4, matrix: 8 }),
    ]);
    expect(blocks).toEqual([
      { kind: "box", at: [0, 0, 0], size: [2, 2, 2], accent: true },
      { kind: "line", a: [0, 0, 0], b: [4, 0, 0], ink: "dim" },
      { kind: "label", at: [1, 1, 3], text: "Repo" },
    ]);
    expect(filters).toEqual([
      { type: "pixelate", size: 3 },
      { type: "dither", matrix: 8 },
    ]);
  });

  it("refuses what it cannot turn into data, naming it", () => {
    const Mine = () => null;
    expect(() => collect(h(Mine))).toThrow(/not <Mine>/);
    expect(() => collect(h("div"))).toThrow(/not <div>/);
    expect(() => collect("hello")).toThrow(/not the text "hello"/);
  });
});

describe("<Blueprint> on the server", () => {
  it("renders the static SVG of the scene, the same as the core, and an empty canvas", () => {
    const markup = html(
      h(
        Blueprint,
        { scene: cube, width: 480, height: 360, title: "A cube" },
        h(Pixelate, { size: 3 }),
        h(Dither, {}),
      ),
    );
    const svg = renderSvg(cube, {
      width: 480,
      height: 360,
      filters: [pixelate(3), { type: "dither" }],
    });
    expect(markup).toContain(svg);
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="A cube"');
    expect(markup).toContain("aspect-ratio:480 / 360");
    expect(markup).toContain("<canvas");
  });

  it("adds children blocks to the scene, runs prop filters first, and is decorative without a title", () => {
    const markup = html(
      h(
        Blueprint,
        { filters: [pixelate(2)], width: 200, height: 100 },
        h(Box, { at: [0, 0, 0], size: [4, 4, 4], accent: true }),
        h(Glow, {}),
      ),
    );
    expect(markup).toContain('viewBox="0 0 100 50"');
    expect(markup).toContain("var(--accent, #ff4f1f)");
    expect(markup).toMatch(/^<div aria-hidden="true"/);
  });

  it("surfaces an invalid chain as an error while rendering", () => {
    expect(() =>
      html(h(Blueprint, { scene: cube }, h(Dither, {}), h(Pixelate, { size: 3 }))),
    ).toThrow(/pixelate.*too late/);
  });
});
