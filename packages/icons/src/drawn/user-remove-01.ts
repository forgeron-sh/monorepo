import type { PixelIcon } from "../types";

// Remove a person: `user-add-01` with a minus.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-remove-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#.ooo",
    "...#..#",
    "....##",
    "",
    "..######",
    ".#......#",
    ".#......#",
    ".#......#",
    ".########",
  ],
};

export default icon;
