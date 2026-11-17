import type { PixelIcon } from "../types";

// Cashback in euros: the anticlockwise ring of `rotate-left-01` around a euro sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cashback-euro",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....ooo.#",
    "###..o....#",
    ".#.oooo...#",
    ".....o....#",
    "......ooo.#",
    "..........#",
    ".........#",
    "......###",
  ],
};

export default icon;
