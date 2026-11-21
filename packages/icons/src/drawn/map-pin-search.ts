import type { PixelIcon } from "../types";

// Map pin search: the shared map pin with a magnifier badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "map-pin-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..####",
    ".#....#",
    "#..##..#",
    "#..##..#",
    "#......#",
    ".#....#",
    "..#..#",
    "...##..ooo",
    ".......o.o",
    ".......ooo",
    "..........o",
    "...........o",
  ],
};

export default icon;
