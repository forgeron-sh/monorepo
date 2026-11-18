import type { PixelIcon } from "../types";

// Favourite location: the shared map pin with a solid heart badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-favourite-01",
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
    "...##..oo.oo",
    ".......ooooo",
    ".......ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
