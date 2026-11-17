import type { PixelIcon } from "../types";

// Person with a cog badge in the secondary tone, lower right. Built on `user-lock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-settings-01",
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
    "..###..o.o",
    ".#....ooooo",
    ".#....oo.oo",
    ".#....ooooo",
    ".####..o.o",
  ],
};

export default icon;
