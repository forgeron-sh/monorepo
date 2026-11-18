import type { PixelIcon } from "../types";

// Receipt: the sheet of `receipt-dollar` with a lira sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-turkish-lira",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..o.....#",
    ".#..oo....#",
    ".#.oo.....#",
    ".#..oo....#",
    ".#.oo..o..#",
    ".#..ooo...#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
