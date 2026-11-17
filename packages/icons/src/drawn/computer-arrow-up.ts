import type { PixelIcon } from "../types";

// Monitor of `computer-add` showing an arrow up in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-arrow-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.o.oo.o.#",
    ".#...oo...#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
