import type { PixelIcon } from "../types";

// Circuit board: a square board with a trace between two pads in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circuit-board",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oo.....#",
    ".#.oo.....#",
    ".#..o.....#",
    ".#..oooo..#",
    ".#.....oo.#",
    ".#.....oo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
