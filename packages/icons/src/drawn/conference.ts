import type { PixelIcon } from "../types";

// Conference: three people seated behind a table, the one in the middle a little taller.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "conference",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".##......##",
    ".##.####.##",
    "....####",
    "###......###",
    "",
    "############",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
