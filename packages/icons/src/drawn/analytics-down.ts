import type { PixelIcon } from "../types";

// Analytics down: the screen of `analytics-01` with an arrow falling to the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "analytics-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..o.....#",
    ".#...o....#",
    ".#....o.o.#",
    ".#.....oo.#",
    ".#....ooo.#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
