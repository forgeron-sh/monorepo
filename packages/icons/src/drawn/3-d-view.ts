import type { PixelIcon } from "../types";

// 3D view: an oblique cube in the secondary tone inside the corners of a viewfinder.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "3-d-view",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#...oooo.#",
    "....o..oo",
    "...oooo.o",
    "...o..o.o",
    "...o..oo",
    ".#.oooo...#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
