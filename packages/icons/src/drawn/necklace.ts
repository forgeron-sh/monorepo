import type { PixelIcon } from "../types";

// Necklace: a chain hanging in a U with a diamond pendant in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "necklace",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....####",
    ".....oo",
    "....oooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
