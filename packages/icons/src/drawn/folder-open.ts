import type { PixelIcon } from "../types";

// Open folder: the back of `folder-01` and a front flap slanting down to the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-open",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".####",
    ".#...#####",
    ".#.......#",
    ".#..#######",
    ".#.#......#",
    ".##......#",
    ".#......#",
    ".#######",
  ],
};

export default icon;
