import type { PixelIcon } from "../types";

// Receipt of `receipt-dollar` with a cent sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-cent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#....o...#",
    ".#...ooo..#",
    ".#..o.....#",
    ".#..o.....#",
    ".#...ooo..#",
    ".#....o...#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
