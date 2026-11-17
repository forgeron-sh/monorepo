import type { PixelIcon } from "../types";

// SVG: the three letters S, V and G; the letters of jpg-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "svg-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##.#.#..##",
    "#...#.#.#",
    ".#..#.#.#.##",
    "..#..#..#..#",
    "##...#...##",
  ],
};

export default icon;
