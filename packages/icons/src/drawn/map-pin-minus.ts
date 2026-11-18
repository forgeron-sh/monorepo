import type { PixelIcon } from "../types";

// Map pin minus: the shared map pin with a minus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "map-pin-minus",
  implemented: true,
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
    "...##",
    "",
    ".......ooooo",
  ],
};

export default icon;
