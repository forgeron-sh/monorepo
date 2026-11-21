import type { PixelIcon } from "../types";

// A smartphone with a charging bolt beside it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smartphone-charging",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#...#....oo",
    ".#...#...oo",
    ".#...#..oooo",
    ".#...#...oo",
    ".#...#..oo",
    ".#...#..o",
    ".#...#",
    ".#####",
  ],
};

export default icon;
