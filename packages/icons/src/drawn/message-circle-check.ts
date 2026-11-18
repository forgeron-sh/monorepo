import type { PixelIcon } from "../types";

// Round speech bubble with a check inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-circle-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#......o.#",
    ".#.o...o..#",
    ".#..o.o...#",
    ".#...o....#",
    "..#......#",
    "..#.######",
    "..#.#",
    "..##",
  ],
};

export default icon;
