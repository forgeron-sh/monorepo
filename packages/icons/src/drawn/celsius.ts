import type { PixelIcon } from "../types";

// Degrees Celsius: a small degree ring beside a capital C.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "celsius",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##",
    "#..#",
    "#..#..####",
    ".##..#....#",
    "....#",
    "....#",
    "....#",
    "....#",
    ".....#....#",
    "......####",
  ],
};

export default icon;
