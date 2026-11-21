import type { PixelIcon } from "../types";

// Map in a rounded square: a road cutting the lower-left corner and a pin, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maps-square-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#....oo..#",
    ".#...o..o.#",
    ".#...o..o.#",
    ".#....oo..#",
    ".#....oo..#",
    ".##.......#",
    ".#.#......#",
    ".#..#.....#",
    "..##.######",
  ],
};

export default icon;
