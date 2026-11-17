import type { PixelIcon } from "../types";

// Analytics up: the screen of `analytics-01` with an arrow climbing to the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "analytics-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#....ooo.#",
    ".#.....oo.#",
    ".#....o.o.#",
    ".#...o....#",
    ".#..o.....#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
