import type { PixelIcon } from "../types";

// UV: the two letters U and V.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "uv-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#..#.#...#",
    ".#..#.#...#",
    ".#..#..#.#",
    ".#..#..#.#",
    ".#..#...#",
    "..##....#",
  ],
};

export default icon;
