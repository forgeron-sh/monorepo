import type { PixelIcon } from "../types";

// Traffic cone: a stepped trapezoid with two stripes in the secondary tone on a flat base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cone-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
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
