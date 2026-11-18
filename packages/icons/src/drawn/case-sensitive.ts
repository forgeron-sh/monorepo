import type { PixelIcon } from "../types";

// Case sensitive: a capital A and a small a.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "case-sensitive",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".###",
    "#...#",
    "#...#",
    "#...#...###",
    "#####......#",
    "#...#...####",
    "#...#..#...#",
    "#...#...####",
  ],
};

export default icon;
