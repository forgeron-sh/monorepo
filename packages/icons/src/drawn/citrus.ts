import type { PixelIcon } from "../types";

// Citrus fruit: a round orange with a leaf in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "citrus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......ooo",
    ".....oo",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
