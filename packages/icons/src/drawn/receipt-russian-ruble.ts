import type { PixelIcon } from "../types";

// Receipt: the sheet of `receipt-dollar` with a ruble sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-russian-ruble",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..ooo...#",
    ".#.ooo....#",
    ".#..o.....#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
