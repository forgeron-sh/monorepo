import type { PixelIcon } from "../types";

// Coastal sailboat: the boat hull with two small sails, a sloop.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sailboat-coastal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....##o",
    "...#.#.o",
    "..#..#..o",
    ".#...#...o",
    ".####.oooo",
    ".....#",
    ".##########",
    "..#......#",
    "...######",
  ],
};

export default icon;
