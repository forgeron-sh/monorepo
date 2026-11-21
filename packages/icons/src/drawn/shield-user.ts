import type { PixelIcon } from "../types";

// Shield (the outline of `shield-01`) with a person inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-user",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#..oooo..#",
    "..#.oooo.#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
