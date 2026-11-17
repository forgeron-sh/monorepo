import type { PixelIcon } from "../types";

// Corn: a cob with kernel rows between two husks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "corn",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "....####",
    ".o..#..#..o",
    ".o..####..o",
    ".o..#..#..o",
    "..o.####.o",
    "..o.#..#.o",
    "...o.##.o",
    "....o..o",
    ".....oo",
  ],
};

export default icon;
