import type { PixelIcon } from "../types";

// Idea: a light bulb and rays in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-idea",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o...oo...o",
    "..o......o",
    "....####",
    "...#....#",
    "oo.#....#.oo",
    "...#....#",
    "....#..#",
    "....####",
    "....####",
    ".....##",
  ],
};

export default icon;
