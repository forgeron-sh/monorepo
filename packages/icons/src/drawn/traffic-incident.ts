import type { PixelIcon } from "../types";

// Traffic cone with two bands in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "traffic-incident",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....oooo",
    "...#....#",
    "...#....#",
    "..oooooooo",
    "..#......#",
    ".#........#",
    "############",
  ],
};

export default icon;
