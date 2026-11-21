import type { PixelIcon } from "../types";

// Target with an arrow in its centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "goal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    "...######.oo",
    "..#......o",
    ".#......o.#",
    ".#...##o..#",
    ".#..#.o#..#",
    ".#..#..#..#",
    ".#...##...#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
