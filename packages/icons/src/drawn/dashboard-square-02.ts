import type { PixelIcon } from "../types";

// Dashboard: a tall panel on the left, two panels on the right, the top one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-square-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..oooo",
    ".#..#..o..o",
    ".#..#..o..o",
    ".#..#..oooo",
    ".#..#",
    ".#..#",
    ".#..#..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
