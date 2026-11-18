import type { PixelIcon } from "../types";

// Arrow down in a ring: `circle-arrow-up-01` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-down-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
