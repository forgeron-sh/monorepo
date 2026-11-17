import type { PixelIcon } from "../types";

// Cable car: a cabin hanging from a cable, its windows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cable-car",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    ".....##",
    ".....##",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
