import type { PixelIcon } from "../types";

// Apple with its stem and a leaf, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "natural-food",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........oo",
    "......#oo",
    "..###.####",
    ".#...#....#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#.##.#",
    "....#..#",
  ],
};

export default icon;
