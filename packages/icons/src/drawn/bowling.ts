import type { PixelIcon } from "../types";

// Bowling: a pin with a stripe in the secondary tone beside a ball.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bowling",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..##",
    ".#..#",
    ".#..#",
    "..oo",
    ".#..#",
    "#....#",
    "#....#..###",
    "#....#.#...#",
    "#....#.#.#.#",
    ".#..#..#...#",
    ".####...###",
  ],
};

export default icon;
