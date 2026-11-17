import type { PixelIcon } from "../types";

// Open folder of `folder-open` with a dot in the secondary tone on its flap.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-open-dot",
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
    ".#.#.oo...#",
    ".##..oo..#",
    ".#......#",
    ".#######",
  ],
};

export default icon;
