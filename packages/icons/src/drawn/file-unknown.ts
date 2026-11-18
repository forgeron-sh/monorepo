import type { PixelIcon } from "../types";

// Sheet with a two-pixel question mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-unknown",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#.oooo.#",
    "..#...oo.#",
    "..#..oo..#",
    "..#......#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
