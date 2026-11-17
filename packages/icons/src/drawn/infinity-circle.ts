import type { PixelIcon } from "../types";

// Infinity in the secondary tone inside the full-grid ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "infinity-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..oo..oo..#",
    "#.o..oo..o.#",
    "#.o..oo..o.#",
    "#..oo..oo..#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
