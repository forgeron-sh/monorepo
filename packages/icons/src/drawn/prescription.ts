import type { PixelIcon } from "../types";

// Prescription sign Rx: an R whose leg is crossed by a stroke in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "prescription",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#...#",
    ".#...#",
    ".####",
    ".#.#",
    ".#..#...o",
    ".#...#.o",
    "......#",
    ".....o.#",
    "....o...#",
  ],
};

export default icon;
