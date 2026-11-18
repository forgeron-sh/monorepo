import type { PixelIcon } from "../types";

// Rounded envelope with a minus badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-minus-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".##......##",
    ".#.#....#.#",
    ".#..#..#..#",
    ".#",
    ".#",
    ".#",
    "..###.ooooo",
  ],
};

export default icon;
