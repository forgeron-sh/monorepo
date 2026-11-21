import type { PixelIcon } from "../types";

// Paint roller with its bent handle, the paint on the roller in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paint-roller",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#oooooo###",
    ".########.#",
    "..........#",
    ".....######",
    ".....#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
