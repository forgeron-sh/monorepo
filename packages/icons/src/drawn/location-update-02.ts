import type { PixelIcon } from "../types";

// Location update: the shared map pin with a badge of two circling arrows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "location-update-02",
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
    "...##...oo.o",
    ".......o..oo",
    "",
    ".......oo..o",
    ".......o.oo",
  ],
};

export default icon;
