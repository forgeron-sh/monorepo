import type { PixelIcon } from "../types";

// A smartphone with contactless waves beside it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smartphone-nfc",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#..o",
    ".#...#....o",
    ".#...#..o..o",
    ".#...#...o.o",
    ".#...#...o.o",
    ".#...#..o..o",
    ".#...#....o",
    ".#...#..o",
    ".#####",
  ],
};

export default icon;
