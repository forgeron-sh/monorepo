import type { PixelIcon } from "../types";

// A pointer arrow and a loading ring badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-loading-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".##",
    ".###",
    ".####",
    ".#####",
    ".###...ooo",
    ".#.#..o...o",
    "......o...o",
    "......o",
    ".......o",
  ],
};

export default icon;
