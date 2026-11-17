import type { PixelIcon } from "../types";

// Euro in the ring of `clock-01`: a C and its two bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "euro-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oooo.#",
    ".#.oooo...#",
    ".#..o.....#",
    ".#.oooo...#",
    ".#..o.....#",
    ".#...oooo.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
