import type { PixelIcon } from "../types";

// Two dice set corner to corner, one pip each.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dice-faces-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####",
    "#....#",
    "#.##.#",
    "#.##.#",
    "#....#",
    ".####",
    ".......####",
    "......#....#",
    "......#.##.#",
    "......#.##.#",
    "......#....#",
    ".......####",
  ],
};

export default icon;
