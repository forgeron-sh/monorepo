import type { PixelIcon } from "../types";

// Receipt: the sheet of `receipt-dollar` with an Indian rupee sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "receipt-indian-rupee",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.ooooo..#",
    ".#....o...#",
    ".#.ooooo..#",
    ".#..oo....#",
    ".#...oo...#",
    ".#....oo..#",
    ".#.#....#.#",
    "..#.####.#",
  ],
};

export default icon;
