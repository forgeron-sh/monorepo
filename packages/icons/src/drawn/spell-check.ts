import type { PixelIcon } from "../types";

// Spell check: the letter A with a check mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "spell-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    ".#...#",
    ".#...#",
    ".#####",
    ".#...#",
    ".#...#",
    "...........o",
    "......o...o",
    ".......o.o",
    "........o",
  ],
};

export default icon;
