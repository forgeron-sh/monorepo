import type { PixelIcon } from "../types";

// TIFF: the four letters T, I, F and F, in the style of jpg-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tiff-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "###.#.##.##",
    ".#..#.#..#",
    ".#..#.##.##",
    ".#..#.#..#",
    ".#..#.#..#",
  ],
};

export default icon;
