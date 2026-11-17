import type { PixelIcon } from "../types";

// Monitor on a stand with two bars in the secondary tone, the bar-chart sibling of `analytics-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "analytics-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.....oo.#",
    ".#.....oo.#",
    ".#..oo.oo.#",
    ".#..oo.oo.#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
