import type { PixelIcon } from "../types";

// The price tag of `tag-01` with its tip replaced by a bitcoin sign badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-tag",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#....#",
    ".#.##..#",
    ".#.##...#",
    ".#.......#",
    "..#",
    "...#...oooo",
    "....#..o...o",
    ".....#.oooo",
    ".......o...o",
    ".......oooo",
  ],
};

export default icon;
