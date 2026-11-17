import type { PixelIcon } from "../types";

// City: three blocks of different heights sharing walls, a few lit windows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "city-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#oo#",
    ".####..#",
    ".#..#..####",
    ".#..#oo#..#",
    ".#oo#..#oo#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
