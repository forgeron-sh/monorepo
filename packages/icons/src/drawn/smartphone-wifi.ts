import type { PixelIcon } from "../types";

// A smartphone with a wifi sign beside it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smartphone-wifi",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#..ooo",
    ".#...#.o...o",
    ".#...#",
    ".#...#..ooo",
    ".#...#",
    ".#...#",
    ".#...#...o",
    ".#...#",
    ".#####",
  ],
};

export default icon;
