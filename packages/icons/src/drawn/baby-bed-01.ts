import type { PixelIcon } from "../types";

// A baby's crib with rails and slats.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baby-bed-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#........#",
    ".#........#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
