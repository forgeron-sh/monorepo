import type { PixelIcon } from "../types";

// High-low chart: an axis and two price bars, each with an open tick on the left and a close tick on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-high-low",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#......#",
    ".#..#...##",
    ".#.##...#",
    ".#..#...#",
    ".#..#..##",
    ".#..##..#",
    ".#..#",
    ".#",
    ".##########",
  ],
};

export default icon;
