import type { PixelIcon } from "../types";

// Arrow moving left, then turning down: `arrow-move-right-down` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-move-left-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...########",
    "...#",
    "...#",
    "...#",
    "...#",
    ".#.#.#",
    "..###",
    "...#",
  ],
};

export default icon;
