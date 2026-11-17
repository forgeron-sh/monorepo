import type { PixelIcon } from "../types";

// An asterisk in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-asterisk",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#.o.oo.o.#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#.o.oo.o.#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
