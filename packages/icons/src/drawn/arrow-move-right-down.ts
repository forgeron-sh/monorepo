import type { PixelIcon } from "../types";

// Arrow moving right, then turning down: `arrow-move-down-right` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-move-right-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".########",
    "........#",
    "........#",
    "........#",
    "........#",
    "......#.#.#",
    ".......###",
    "........#",
  ],
};

export default icon;
