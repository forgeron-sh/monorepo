import type { PixelIcon } from "../types";

// Location share: the shared map pin with an up-right arrow badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-share-01",
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
    "...##....ooo",
    "..........oo",
    ".........o.o",
    "........o",
    ".......o",
  ],
};

export default icon;
