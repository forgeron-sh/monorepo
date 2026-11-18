import type { PixelIcon } from "../types";

// Location offline: the shared map pin with a no-entry badge (a ring crossed by a bar) in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-offline-01",
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
    "...##...ooo",
    ".......o..oo",
    ".......o.o.o",
    ".......oo..o",
    "........ooo",
  ],
};

export default icon;
