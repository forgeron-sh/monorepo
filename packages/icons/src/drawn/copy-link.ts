import type { PixelIcon } from "../types";

// Two sheets of `copy-plus` with a link in the secondary tone on the front sheet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "copy-link",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    ".########.#",
    ".#......#.#",
    ".#....oo#.#",
    ".#...o.o#.#",
    ".#..o.o.###",
    ".#..oo..#",
    ".#......#",
    ".########",
  ],
};

export default icon;
