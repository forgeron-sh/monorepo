import type { PixelIcon } from "../types";

// Bluetooth rune: a stem, two right-hand points and the crossing arms, symmetric top to bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bluetooth",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....##",
    ".....#.#",
    "...#.##",
    "....##",
    "....##",
    "...#.##",
    ".....#.#",
    ".....##",
    ".....#",
  ],
};

export default icon;
