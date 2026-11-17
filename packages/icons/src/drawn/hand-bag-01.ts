import type { PixelIcon } from "../types";

// Handbag: a rounded handle over a body that widens towards the base, a clasp in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-bag-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    ".##########",
    ".#........#",
    ".#...oo...#",
    "#..........#",
    "#..........#",
    "#..........#",
    "############",
  ],
};

export default icon;
