import type { PixelIcon } from "../types";

// Ring with a short slash floating inside it, two pixels clear of the ring: the ring of `circle-slash`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-slash-2",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#......#...#",
    "#.....#....#",
    "#....#.....#",
    "#...#......#",
    ".#.........#",
    ".#.........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
