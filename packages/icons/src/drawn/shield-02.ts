import type { PixelIcon } from "../types";

// Shield, its left half filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oooo....#",
    ".#oooo....#",
    ".#oooo....#",
    ".#oooo....#",
    ".#oooo....#",
    "..#ooo...#",
    "...#oo..#",
    "....#o.#",
    ".....##",
  ],
};

export default icon;
