import type { PixelIcon } from "../types";

// An arrow going left then turning down, in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-move-left-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..ooooo.#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#.ooo....#",
    ".#..o.....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
