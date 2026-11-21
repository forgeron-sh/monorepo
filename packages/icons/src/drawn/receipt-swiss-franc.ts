import type { PixelIcon } from "../types";

// Receipt: the sheet of `receipt-dollar` with a franc sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-swiss-franc",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..o.....#",
    ".#..ooo...#",
    ".#..o.....#",
    ".#.ooo....#",
    ".#..o.....#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
