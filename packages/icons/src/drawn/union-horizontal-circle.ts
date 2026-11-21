import type { PixelIcon } from "../types";

// Union of two circles side by side: one outline around both.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "union-horizontal-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###..###",
    ".#...##...#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".#...##...#",
    "..###..###",
  ],
};

export default icon;
