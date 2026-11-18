import type { PixelIcon } from "../types";

// A bitcoin sign in the rounded square of `dollar-square`, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..o.....#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..ooo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
