import type { PixelIcon } from "../types";

// Centralised: four corner nodes linked to one central node in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "centralized",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "###......###",
    "#.#......#.#",
    "###......###",
    "...#....#",
    "....oooo",
    "....o..o",
    "....o..o",
    "....oooo",
    "...#....#",
    "###......###",
    "#.#......#.#",
    "###......###",
  ],
};

export default icon;
