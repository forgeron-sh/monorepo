import type { PixelIcon } from "../types";

// A price line falling onto a dashed stop level in the secondary tone, on chart axes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stop-loss-order",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.#",
    ".#..#",
    ".#...#",
    ".#....#..#",
    ".#.....##",
    "",
    ".#oo..oo..o",
    ".#",
    ".##########",
  ],
};

export default icon;
