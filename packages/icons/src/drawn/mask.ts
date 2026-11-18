import type { PixelIcon } from "../types";

// Face mask: a pleated mask, two pleats in the secondary tone, with ear loops either side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mask",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".##......##",
    "#.#.oooo.#.#",
    "#.#......#.#",
    "#.#.oooo.#.#",
    ".##......##",
    "..#......#",
    "...######",
  ],
};

export default icon;
