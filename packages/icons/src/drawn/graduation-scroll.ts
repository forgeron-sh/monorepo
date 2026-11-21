import type { PixelIcon } from "../types";

// Diploma: a rolled scroll lying flat, tied in the middle by a ribbon in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "graduation-scroll",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####oo####",
    "#.#..oo....#",
    "#.#..oo....#",
    ".####oo####",
    ".....oo",
    "....o..o",
    "...o....o",
  ],
};

export default icon;
