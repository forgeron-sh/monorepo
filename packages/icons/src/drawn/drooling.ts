import type { PixelIcon } from "../types";

// Drooling face: two eyes, a flat mouth, a drop in the secondary tone running off the chin.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drooling",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#..####..#",
    ".#.....o..#",
    "..#....o.#",
    "...####o#",
    ".......o",
  ],
};

export default icon;
