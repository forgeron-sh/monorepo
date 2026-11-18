import type { PixelIcon } from "../types";

// Jumper: a crew-neck knit with long sleeves and cuffs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "jumpers",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    ".##..##..##",
    "#..........#",
    "#.#......#.#",
    "#.#......#.#",
    "#.#......#.#",
    "#.#......#.#",
    "###......###",
    "..#......#",
    "..########",
  ],
};

export default icon;
