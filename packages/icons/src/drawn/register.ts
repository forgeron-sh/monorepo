import type { PixelIcon } from "../types";

// Cash register: a display on a stand over a keyed body and a drawer.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "register",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    "..#oooo#",
    "..######",
    "....##",
    ".##########",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    "############",
    "#....##....#",
    "############",
  ],
};

export default icon;
