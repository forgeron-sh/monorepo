import type { PixelIcon } from "../types";

// Person with a one-pixel plus badge in the lower corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-add-02",
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
    "..###...o",
    ".#......o",
    ".#....ooooo",
    ".#......o",
    ".####...o",
  ],
};

export default icon;
