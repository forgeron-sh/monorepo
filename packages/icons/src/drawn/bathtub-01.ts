import type { PixelIcon } from "../types";

// Bathtub seen from the side, with a tap rising on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bathtub-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".#..#",
    ".#",
    ".#",
    "############",
    "#..........#",
    "#..........#",
    ".#........#",
    "..########",
    "..#......#",
  ],
};

export default icon;
