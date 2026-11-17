import type { PixelIcon } from "../types";

// University: a dome on a base, three two-pixel columns and a plinth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "university",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    ".##########",
    "..##.##.##",
    "..##.##.##",
    "..##.##.##",
    ".##########",
    ".##########",
  ],
};

export default icon;
