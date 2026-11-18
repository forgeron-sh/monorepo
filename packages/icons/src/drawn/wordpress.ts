import type { PixelIcon } from "../types";

// The WordPress mark: a serif W inside a ring, the W in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wordpress",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#.o..oo..o.#",
    "#.o..oo..o.#",
    "#..o.oo.o..#",
    "#..oo..oo..#",
    ".#.o...o..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
