import type { PixelIcon } from "../types";

// Bucket: a tapered pail with a rim and an arched handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bucket",
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
    "..#......#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
