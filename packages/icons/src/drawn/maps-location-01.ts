import type { PixelIcon } from "../types";

// Location on a map: the shared map pin above a three-panel folded map in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maps-location-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..#..##..#",
    "..#..##..#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    "oooo....oooo",
    "o..oooooo..o",
    "o..o....o..o",
    "oooooooooooo",
  ],
};

export default icon;
