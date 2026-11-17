import type { PixelIcon } from "../types";

// Fork: three tines (the middle one two pixels wide, centred), a neck and a two-pixel handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fork",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#.##.#",
    "...#.##.#",
    "...#.##.#",
    "...######",
    "....####",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
