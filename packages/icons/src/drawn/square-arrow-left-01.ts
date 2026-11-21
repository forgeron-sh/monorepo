import type { PixelIcon } from "../types";

// Arrow left in a box: `square-arrow-up-01` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-left-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...o....#",
    ".#..oo....#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#..oo....#",
    ".#...o....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
