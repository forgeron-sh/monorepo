import type { PixelIcon } from "../types";

// Greenhouse: the outline of `home-01` without its door, a sprout in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "green-house",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#.oo..oo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".##########",
  ],
};

export default icon;
