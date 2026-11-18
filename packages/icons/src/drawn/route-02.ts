import type { PixelIcon } from "../types";

// Route: a start node, a path in the secondary tone, a pin at the end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "route-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    ".......#..#",
    "........##",
    "........##",
    "........o",
    "..oooooo",
    ".###",
    ".#.#",
    ".###",
  ],
};

export default icon;
