import type { PixelIcon } from "../types";

// The arrow of `arrow-up-right-01` leaving a stack corner drawn in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "arrow-up-right-stack",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....######",
    ".........##",
    ".o......#.#",
    ".o.....#..#",
    ".o....#...#",
    ".o...#....#",
    ".o..#",
    ".o.#",
    ".o",
    ".ooooooooo",
  ],
};

export default icon;
