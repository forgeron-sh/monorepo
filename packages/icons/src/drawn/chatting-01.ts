import type { PixelIcon } from "../types";

// Two speech bubbles: the front one lower right with its tail on the right, the one behind it
// upper left in the secondary tone with its tail on the left, hidden by the front bubble and a
// one-pixel clearance (redrawn on 2026-11-17: the two outlines ran into each other).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chatting-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..ooooo",
    ".o.....o",
    ".o",
    ".o...#####",
    ".o..#.....#",
    ".o..#.....#",
    ".o..#.....#",
    ".oo..###..#",
    "........#.#",
    ".........##",
  ],
};

export default icon;
