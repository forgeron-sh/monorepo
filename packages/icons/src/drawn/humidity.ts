import type { PixelIcon } from "../types";

// Water drop with a percent sign inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "humidity",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#.oo...o.#",
    ".#.oo..o..#",
    ".#....o...#",
    ".#...o.oo.#",
    ".#..o..oo.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
