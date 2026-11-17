import type { PixelIcon } from "../types";

// Two folders: a folder-01 in front of a second one offset up and right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folders",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "...#...#####",
    "...#.......#",
    ".####......#",
    ".#...#####.#",
    ".#.......#.#",
    ".#.......#.#",
    ".#.......###",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
