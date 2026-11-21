import type { PixelIcon } from "../types";

// Receipt: the sheet of `receipt-dollar` with a pound sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-pound-sterling",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...ooo..#",
    ".#..o.....#",
    ".#.oooo...#",
    ".#..o.....#",
    ".#..o.....#",
    ".#.ooooo..#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
