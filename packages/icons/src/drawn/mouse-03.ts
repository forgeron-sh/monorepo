import type { PixelIcon } from "../types";

// Wired mouse: the body of `mouse-01`, shorter, with its cable on top and the wheel in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    ".....#",
    "....####",
    "...#.oo.#",
    "...#.oo.#",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
  ],
};

export default icon;
