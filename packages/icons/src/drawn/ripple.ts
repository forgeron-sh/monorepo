import type { PixelIcon } from "../types";

// Ripple: a dot in the secondary tone, a ring around it and two outer arcs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ripple",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#..####..#",
    "#..#....#..#",
    "#..#.oo.#..#",
    "#..#.oo.#..#",
    "#..#....#..#",
    ".#..####..#",
  ],
};

export default icon;
