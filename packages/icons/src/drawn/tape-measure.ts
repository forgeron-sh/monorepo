import type { PixelIcon } from "../types";

// A tape measure case with its tape pulled out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tape-measure",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..######",
    ".#......#",
    ".#..##..#",
    ".#.#..#.#",
    ".#.#..#.#",
    ".#..##..#..o",
    ".#......#ooo",
    "..######",
  ],
};

export default icon;
