import type { PixelIcon } from "../types";

// JPG: the three letters J, P and G.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "jpg-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..#.##...##",
    "..#.#.#.#",
    "..#.##..#.##",
    "#.#.#...#..#",
    ".#..#....##",
  ],
};

export default icon;
