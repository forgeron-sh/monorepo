import type { PixelIcon } from "../types";

// Devil face: horns in the secondary tone, slanted angry eyes, a grin.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "evil",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o........o",
    ".oo######oo",
    "..#......#",
    ".#........#",
    ".#.#....#.#",
    ".#..#..#..#",
    ".#........#",
    ".#.#....#.#",
    ".#..####..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
