import type { PixelIcon } from "../types";

// Hanging ID badge with a portrait and a name line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "id-card",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..########",
  ],
};

export default icon;
