import type { PixelIcon } from "../types";

// A euro sign in a rounded square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "euro-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....ooo.#",
    ".#..oo....#",
    ".#.ooooo..#",
    ".#.ooooo..#",
    ".#..oo....#",
    ".#....ooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
