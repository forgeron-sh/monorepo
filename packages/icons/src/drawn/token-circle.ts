import type { PixelIcon } from "../types";

// A token: the full-grid ring of `circle` with a pointed hexagon inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "token-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#.oo..oo.#",
    "#.o......o.#",
    "#.o......o.#",
    "#.o......o.#",
    "#.o......o.#",
    ".#.oo..oo.#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
