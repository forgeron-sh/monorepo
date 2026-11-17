import type { PixelIcon } from "../types";

// History: the ring and hands of `clock-01`, the ring turning back on itself with an arrowhead
// on the lower left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "history",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#...o....#",
    ".#...o....#",
    "###..oooo.#",
    ".#........#",
    "..........#",
    ".........#",
    "...######",
  ],
};

export default icon;
