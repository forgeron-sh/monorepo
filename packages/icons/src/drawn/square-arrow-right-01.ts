import type { PixelIcon } from "../types";

// Arrow right in a box: `square-arrow-left-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-right-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....o...#",
    ".#....oo..#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#....oo..#",
    ".#....o...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
