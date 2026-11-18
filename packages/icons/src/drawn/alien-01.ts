import type { PixelIcon } from "../types";

// Alien head: a domed head narrowing to the chin, two slanted eyes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alien-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#.oo..oo.#",
    ".#..o..o..#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
