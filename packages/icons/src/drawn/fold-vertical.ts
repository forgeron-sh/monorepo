import type { PixelIcon } from "../types";

// Two arrows pointing in at a fold line in the secondary tone: fold up and down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fold-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#",
    "...#.#.#",
    "....###",
    ".....#",
    "",
    "..ooooooo",
    "..ooooooo",
    "",
    ".....#",
    "....###",
    "...#.#.#",
    ".....#",
  ],
};

export default icon;
