import type { PixelIcon } from "../types";

// Ball moving to the right with two speed lines behind it, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "motion-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......####",
    ".....#....#",
    "ooo.#......#",
    "....#......#",
    "....#......#",
    "ooo.#......#",
    ".....#....#",
    "......####",
  ],
};

export default icon;
