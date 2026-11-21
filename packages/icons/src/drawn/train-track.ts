import type { PixelIcon } from "../types";

// A straight railway track seen from above: two rails on sleepers.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "train-track",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#....#",
    ".oo#oooo#oo",
    "...#....#",
    "...#....#",
    ".oo#oooo#oo",
    "...#....#",
    "...#....#",
    ".oo#oooo#oo",
    "...#....#",
    "...#....#",
    ".oo#oooo#oo",
    "...#....#",
  ],
};

export default icon;
