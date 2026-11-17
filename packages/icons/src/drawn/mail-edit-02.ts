import type { PixelIcon } from "../types";

// Rounded envelope with a pencil badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-edit-02",
  implemented: true,
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
    ".#.......oo",
    ".#......ooo",
    "..###..ooo",
    "......ooo",
    "......o",
  ],
};

export default icon;
