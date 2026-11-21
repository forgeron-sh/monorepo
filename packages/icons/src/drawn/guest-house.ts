import type { PixelIcon } from "../types";

// Guest house: the outline of `home-01` without its door, a guest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "guest-house",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".##########",
  ],
};

export default icon;
