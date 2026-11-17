import type { PixelIcon } from "../types";

// Table split in two between its rows, the cut in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "table-rows-split",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
    "",
    ".oooooooooo",
    "",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
  ],
};

export default icon;
