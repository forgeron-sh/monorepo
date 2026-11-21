import type { PixelIcon } from "../types";

// Cowboy hat: a creased crown, a band in the secondary tone, a wide brim curled up at both ends.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cowboy-hat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##..##",
    "..#..##..#",
    "..#......#",
    "..#......#",
    "#.oooooooo.#",
    "##........##",
    ".##########",
  ],
};

export default icon;
