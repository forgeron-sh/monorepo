import type { PixelIcon } from "../types";

// Speaker with a minus in the secondary tone: turn the volume down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "volume-minus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....#",
    "....##",
    ".###.#",
    ".#...#..oooo",
    ".#...#",
    ".###.#",
    "....##",
    ".....#",
  ],
};

export default icon;
