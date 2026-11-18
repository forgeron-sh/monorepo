import type { PixelIcon } from "../types";

// Location checked: the shared map pin with a bold two-pixel check badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "location-check-02",
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
    "..........oo",
    ".......o.oo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
