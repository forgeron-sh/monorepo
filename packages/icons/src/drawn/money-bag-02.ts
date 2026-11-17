import type { PixelIcon } from "../types";

// Money bag: two knot flaps, a tie, a round sack with an S in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-bag-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "...######",
    "..#......#",
    ".#..oooo..#",
    ".#..ooo...#",
    ".#..oooo..#",
    ".#...ooo..#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
