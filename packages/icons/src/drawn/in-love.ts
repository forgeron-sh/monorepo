import type { PixelIcon } from "../types";

// Round face with heart eyes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "in-love",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#.o.o..o.o.#",
    "#.ooo..ooo.#",
    "#..o....o..#",
    "#..........#",
    ".#..####..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
