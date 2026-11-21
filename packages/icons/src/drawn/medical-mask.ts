import type { PixelIcon } from "../types";

// Surgical face mask with pleats in the secondary tone and ear loops.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medical-mask",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    ".##......##",
    "#.#.oooo.#.#",
    "#.#......#.#",
    "#.#.oooo.#.#",
    ".##......##",
    "...######",
  ],
};

export default icon;
