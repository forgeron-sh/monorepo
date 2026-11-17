import type { PixelIcon } from "../types";

// File with a plus badge: `file-01` one column left, the badge in the secondary tone at the lower
// right, the file cut back one pixel around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-add",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#......o",
    ".#......o",
    ".#....ooooo",
    ".#......o",
    ".####...o",
  ],
};

export default icon;
