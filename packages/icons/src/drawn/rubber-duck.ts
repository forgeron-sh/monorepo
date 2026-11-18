import type { PixelIcon } from "../types";

// Rubber duck seen from the side: round head with an eye, beak in the secondary tone, body and tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rubber-duck",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..#....#",
    "oo#.#..#",
    "..#....#..##",
    ".#......##.#",
    "#..........#",
    "#..........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
