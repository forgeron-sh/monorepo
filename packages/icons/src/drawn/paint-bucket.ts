import type { PixelIcon } from "../types";

// Bucket with a handle and a drop of paint in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paint-bucket",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...####",
    "..#....#",
    ".#......#",
    "##########",
    ".#......#",
    ".#........o",
    "..#....#.ooo",
    "..#....#.ooo",
    "..######..o",
  ],
};

export default icon;
