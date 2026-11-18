import type { PixelIcon } from "../types";

// Chest expander: two loop handles joined by three cables in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "expander",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##......##",
    "#.#......#.#",
    "#.#......#.#",
    "#.#oooooo#.#",
    "#.#......#.#",
    "#.#oooooo#.#",
    "#.#......#.#",
    "#.#oooooo#.#",
    "#.#......#.#",
    ".##......##",
  ],
};

export default icon;
