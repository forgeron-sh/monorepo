import type { PixelIcon } from "../types";

// Obtuse angle: a base line and a 2:1 side leaning back, the arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "obtuse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "#",
    "#",
    ".#",
    ".#",
    "..#",
    "..#..oo",
    "...#...o",
    "...#....o",
    "....#######",
  ],
};

export default icon;
