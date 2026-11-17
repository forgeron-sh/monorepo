import type { PixelIcon } from "../types";

// Bowl with a two-leaf sprout growing from it, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "organic-food",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......oooo",
    "......o...o",
    ".oooo.o..o",
    ".o...#ooo",
    "..o..#",
    "...oo#",
    ".....#",
    "############",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
