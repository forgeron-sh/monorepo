import type { PixelIcon } from "../types";

// A smartphone with a wifi sign beside it, its dot crossed out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "smartphone-lost-wifi",
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
    ".#...#..o.o",
    ".#...#...o",
    ".#####..o.o",
  ],
};

export default icon;
