import type { PixelIcon } from "../types";

// Flip-flop seen from above: a sole narrowing at the waist, its V strap in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sandals",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "...#.oo.#",
    "...#o..o#",
    "...o....o",
    "...#....#",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
  ],
};

export default icon;
