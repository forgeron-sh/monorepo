import type { PixelIcon } from "../types";

// Swimmer's head and shoulders above waves, one arm up holding a ball in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "water-polo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........oo",
    "........oo",
    ".......#",
    "..##..#",
    "..##.#",
    ".#####",
    "",
    ".##..##..##",
    "#..##..##..#",
  ],
};

export default icon;
