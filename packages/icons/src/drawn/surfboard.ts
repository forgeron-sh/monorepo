import type { PixelIcon } from "../types";

// An upright surfboard with a pointed nose, a centre stripe in the secondary tone and a fin.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "surfboard",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "....#..#",
    "...#.oo.#",
    "...#.oo.#",
    "...#.oo.#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
  ],
};

export default icon;
