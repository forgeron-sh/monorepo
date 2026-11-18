import type { PixelIcon } from "../types";

// Nose seen from the front: a narrow bridge widening into the wings, two nostrils in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "nose",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#..#",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#.oo..oo.#",
    "..##.##.##",
  ],
};

export default icon;
