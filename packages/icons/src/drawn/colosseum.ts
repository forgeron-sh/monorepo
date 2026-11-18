import type { PixelIcon } from "../types";

// Colosseum: tiers of arches, the top tier broken off on one side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "colosseum",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..##",
    ".#..#.#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    "############",
  ],
};

export default icon;
