import type { PixelIcon } from "../types";

// The Java mark: a coffee cup on a saucer with two wisps of steam above it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "java",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    ".....o..o",
    "....o...o",
    "....o..o",
    ".....o.o",
    "",
    ".########",
    "..######.#",
    "..######.#",
    "...####.#",
    "",
    "##########",
  ],
};

export default icon;
