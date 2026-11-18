import type { PixelIcon } from "../types";

// Wheelchair: the person sitting in the chair, the wheel as a stepped arc, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wheelchair",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oo",
    "....oo",
    "",
    "....##",
    "....#####",
    "..#.##",
    ".#..######",
    "#.......#",
    "#.......#",
    ".#....#..##",
    "..####",
  ],
};

export default icon;
