import type { PixelIcon } from "../types";

// Speech bubble with an arrow pointing in to the lower left, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-incoming-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.....o..#",
    ".#....o...#",
    ".#.o.o....#",
    ".#.oo.....#",
    ".#.ooo....#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
