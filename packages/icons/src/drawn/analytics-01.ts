import type { PixelIcon } from "../types";

// Analytics: a screen on a stand with a data line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "analytics-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.......o#",
    ".#......o.#",
    ".#.o..oo..#",
    ".#..oo....#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
