import type { PixelIcon } from "../types";

// Location on a road: the shared map pin above a road whose dashed centre line is in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "road-location-01",
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
    "",
    "############",
    ".oo..oo..oo",
    "############",
  ],
};

export default icon;
