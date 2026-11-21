// The board of every kind, written before the refactor into plugins (D-154) and kept here: with the
// `full` preset the JSON, the SVG exports, the paint of each item in the page and its far view are
// byte for byte what the editor produced before. A change that touches a line of a fixture is a
// change of behaviour.

import { describe, expect, it } from "vitest";
import {
  exportSvg,
  farPrimitives,
  pagePaint,
  paintItem,
  parseBoard,
  serializeBoard,
  toMarkup,
} from "../index";
import { goldenAllSvg, goldenBoard, goldenFrameSvg, goldenPage } from "./fixtures/golden";
import { corePresets } from "./index";

const json = goldenBoard;
const board = parseBoard(json);
const all = board.items.map((i) => i.id);

describe("the golden board, with the full preset", () => {
  it("has every kind", () => {
    expect(new Set(board.items.map((i) => i.kind))).toEqual(
      new Set([
        "frame",
        "rectangle",
        "ellipse",
        "diamond",
        "sticky",
        "text",
        "arrow",
        "pen",
        "image",
      ]),
    );
  });

  it("reads today's boards and writes the same JSON back", () => {
    const written = JSON.parse(serializeBoard(board.items, board.viewport));
    expect(written).toEqual({ format: "forgeron/draw", version: 1, ...JSON.parse(json) });
    // And with the list named, not defaulted.
    expect(parseBoard(json, corePresets.full).items).toEqual(board.items);
  });

  it("exports the same SVG", () => {
    expect(exportSvg(board.items, { ids: all })!.svg + "\n").toBe(goldenAllSvg);
    expect(exportSvg(board.items, { ids: ["frame-1"], background: "bg" })!.svg + "\n").toBe(
      goldenFrameSvg,
    );
    expect(exportSvg(board.items, { ids: all }, corePresets.full)!.svg + "\n").toBe(goldenAllSvg);
  });

  it("paints and draws far the same", () => {
    const page = board.items
      .map(
        (i) =>
          `${i.id}\n${toMarkup(paintItem(i, pagePaint("g")))}\n${JSON.stringify(farPrimitives(i))}`,
      )
      .join("\n\n");
    expect(page + "\n").toBe(goldenPage);
  });
});
