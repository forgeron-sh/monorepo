import type { PixelIcon } from "../types";

// First place: the wreath of `laurel-wreath-01` round a 1 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laurel-wreath-first-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#...o..#",
    "#.#..oo..#.#",
    ".##...o..##",
    "#.#...o..#.#",
    ".##..ooo.##",
    "#..#....#..#",
    ".###....###",
    "....#..#",
    ".....##",
  ],
};

export default icon;
