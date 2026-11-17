import type { PixelIcon } from "../types";

// Person with a no-entry badge (ring and slash) in the secondary tone, lower right. Built on
// `user-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-block-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###..ooo",
    ".#....o..oo",
    ".#....o.o.o",
    ".#....oo..o",
    ".####..ooo",
  ],
};

export default icon;
