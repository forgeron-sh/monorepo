import type { PixelIcon } from "../types";

// A dollar sign in a rounded square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dollar-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oooo.#",
    ".#..o.o...#",
    ".#...ooo..#",
    ".#....o.o.#",
    ".#..oooo..#",
    ".#....o...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
