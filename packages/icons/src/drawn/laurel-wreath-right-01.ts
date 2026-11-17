import type { PixelIcon } from "../types";

// Right branch of `laurel-wreath-01`, centred on the grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laurel-wreath-right-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "......#.#",
    "......##",
    "......#.#",
    "......##",
    ".....#..#",
    ".....###",
    "....#",
    "...#",
  ],
};

export default icon;
