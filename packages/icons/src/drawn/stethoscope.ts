import type { PixelIcon } from "../types";

// Stethoscope: two ear tubes joining into one, curving to the chest piece in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stethoscope",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...#",
    ".#...#",
    ".#...#",
    "..#.#",
    "...#....oo",
    "...#...o..o",
    "...#...o..o",
    "...#....oo",
    "....#...#",
    ".....###",
  ],
};

export default icon;
