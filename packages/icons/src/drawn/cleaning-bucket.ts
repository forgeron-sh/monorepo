import type { PixelIcon } from "../types";

// The bucket of `bucket` filled with water.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cleaning-bucket",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....####",
    "...#....#",
    "..#......#",
    ".##########",
    "..#......#",
    "..#oooooo#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
