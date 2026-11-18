import type { PixelIcon } from "../types";

// Location of a person: the shared map pin with a person badge (a round head over shoulders) in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-user-01",
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
    "...##...ooo",
    "........ooo",
    "",
    ".......ooooo",
    ".......o...o",
  ],
};

export default icon;
