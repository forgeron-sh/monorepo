import type { PixelIcon } from "../types";

// The HackerRank mark: a pointed hexagon with the letter H cut out of it.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hackerrank",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "...######",
    ".##########",
    ".##.####.##",
    ".##.####.##",
    ".##......##",
    ".##......##",
    ".##.####.##",
    ".##.####.##",
    ".##########",
    "...######",
    ".....##",
  ],
};

export default icon;
