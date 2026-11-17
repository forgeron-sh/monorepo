import type { PixelIcon } from "../types";

// Stacked squares: three square outlines offset on the diagonal, the front one whole.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layers-logo",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....######",
    ".....#....#",
    "...######.#",
    "...#....#.#",
    ".######.#.#",
    ".#....#.#.#",
    ".#....#.#",
    ".#....###",
    ".#....#",
    ".######",
  ],
};

export default icon;
