import type { PixelIcon } from "../types";

// Starred location: the shared map pin with a solid star badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-star-01",
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
    "...##....o",
    ".......ooooo",
    "........ooo",
    "........ooo",
    ".......oo.oo",
  ],
};

export default icon;
