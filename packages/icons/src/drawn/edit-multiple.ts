import type { PixelIcon } from "../types";

// Edit several: a sheet behind another, a solid 45° pencil in the secondary tone writing in the front one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "edit-multiple",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "...#.....#",
    ".#######.#",
    ".#.....#.#",
    ".#...oo#.#",
    ".#..oo.#.#",
    ".#.oo..#.#",
    ".#.o...###",
    ".#.....#",
    ".#######",
  ],
};

export default icon;
