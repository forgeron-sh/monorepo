import type { PixelIcon } from "../types";

// Person with a status dot: the person of `user-warning-01`, a round dot badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-status",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###",
    ".#......oo",
    ".#.....oooo",
    ".#.....oooo",
    ".####...oo",
  ],
};

export default icon;
