import type { PixelIcon } from "../types";

// Price tag at 45°: a square corner with the hole in the secondary tone, two parallel edges
// and a short end, mirror-symmetric about the diagonal (a horizontal tag read as a battery).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tag-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#....#",
    ".#.oo..#",
    ".#.oo...#",
    ".#.......#",
    "..#.......#",
    "...#.....#",
    "....#...#",
    ".....#.#",
    "......#",
  ],
};

export default icon;
