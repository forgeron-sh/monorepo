import type { PixelIcon } from "../types";

// House with a heart inside: the outline of `home-01` without its door, a heart in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "house-heart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
