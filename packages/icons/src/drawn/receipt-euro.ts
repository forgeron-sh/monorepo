import type { PixelIcon } from "../types";

// Receipt of `receipt-dollar` with a euro sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-euro",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#....ooo.#",
    ".#..oo....#",
    ".#.ooooo..#",
    ".#.ooooo..#",
    ".#..oo....#",
    ".#....ooo.#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
