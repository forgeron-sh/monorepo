import type { PixelIcon } from "../types";

// The money bag of `money-bag-02` with a bitcoin sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-bag",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "...######",
    "..#......#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..ooo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
