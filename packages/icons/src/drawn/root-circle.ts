import type { PixelIcon } from "../types";

// Square root in a circle: the radical of `square-radical` in the secondary tone inside a round outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "root-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....ooo.#",
    ".#....o...#",
    ".#...o....#",
    ".#...o....#",
    ".#.oo.....#",
    ".#..o.....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
