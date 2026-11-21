import type { PixelIcon } from "../types";

// Round-the-clock: a clock face with 24 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "24-hours-clock",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..oo..o.o.#",
    "#....o.ooo.#",
    "#...o....o.#",
    "#..ooo...o.#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
