import type { PixelIcon } from "../types";

// File with an attachment: the sheet of `file-x`, the paper clip of `folder-attachment` as a badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-attachment",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#......ooo",
    ".#.....o...o",
    ".#.....o.o.o",
    ".#.....o.o.o",
    ".#.....o.o",
    ".####...o",
  ],
};

export default icon;
