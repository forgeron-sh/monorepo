import type { PixelIcon } from "../types";

// Battery standing upright, its charge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#......#",
    "..########",
  ],
};

export default icon;
