import type { PixelIcon } from "../types";

// Dirham: a letter D with two bars across it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dirham",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#####",
    "...#....#",
    "...#.....#",
    ".##########",
    "...#.....#",
    "...#.....#",
    ".##########",
    "...#.....#",
    "...#....#",
    "...#####",
  ],
};

export default icon;
