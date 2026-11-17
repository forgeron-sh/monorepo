import type { PixelIcon } from "../types";

// A letter F in the secondary tone in the frame of `square`, drawn like the P of `parking-area-square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-f",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..ooooo.#",
    ".#..oo....#",
    ".#..oooo..#",
    ".#..oo....#",
    ".#..oo....#",
    ".#..oo....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
