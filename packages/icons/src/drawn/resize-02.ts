import type { PixelIcon } from "../types";

// Resize grip: the rounded square of `square` with the diagonal grip lines in its lower right corner in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "resize-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.......o#",
    ".#......o.#",
    ".#.....o..#",
    ".#....o..o#",
    ".#...o..o.#",
    "..########",
  ],
};

export default icon;
