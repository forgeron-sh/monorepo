import type { PixelIcon } from "../types";

// AI sheets: a spreadsheet grid with the AI sparkle badge in place of its last cell.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-sheets",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#",
    ".######..o",
    ".#..#...ooo",
    ".#..#..ooooo",
    ".#####..ooo",
    ".........o",
  ],
};

export default icon;
