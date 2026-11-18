import type { PixelIcon } from "../types";

// Cashback in bitcoin: the return arrow ring of `cashback` around a bitcoin sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "cashback-bitcoin",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    "###..ooo..#",
    ".#...o..o.#",
    ".....ooo..#",
    ".....o..o.#",
    ".....ooo..#",
    ".....o...#",
    "......###",
  ],
};

export default icon;
