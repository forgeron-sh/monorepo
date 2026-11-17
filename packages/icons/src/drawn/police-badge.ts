import type { PixelIcon } from "../types";

// Police badge: `shield-01` with a star inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "police-badge",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#..o..o..#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
