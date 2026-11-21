import type { PixelIcon } from "../types";

// Map search: the folded map of `maps-location-01` with a magnifying glass badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maps-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..####..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#",
    ".#..#.ooo",
    ".####.o.o",
    "....#.ooo",
    ".........o",
    "..........o",
  ],
};

export default icon;
