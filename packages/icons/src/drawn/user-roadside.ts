import type { PixelIcon } from "../types";

// A person with a traffic cone: roadside assistance. Person of `user-lock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-roadside",
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
    ".#.....ooo",
    ".#",
    ".#.....ooo",
    ".####.ooooo",
  ],
};

export default icon;
