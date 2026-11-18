import type { PixelIcon } from "../types";

// Exercise ball: a big ball with a curved highlight in the secondary tone, on the floor.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "yoga-ball",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..##....##",
    ".#.oo.....#",
    ".#.o......#",
    ".#.o......#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "...######",
    ".oooooooooo",
  ],
};

export default icon;
