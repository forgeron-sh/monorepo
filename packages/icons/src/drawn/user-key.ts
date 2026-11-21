import type { PixelIcon } from "../types";

// Person with a key badge, the key of `folder-key`, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-key",
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
    "..###",
    ".#....ooo",
    ".#....o.ooo",
    ".#....ooo.o",
    ".####",
  ],
};

export default icon;
