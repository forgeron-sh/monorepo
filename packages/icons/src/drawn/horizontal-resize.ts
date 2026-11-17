import type { PixelIcon } from "../types";

// Horizontal resize: a divider in the secondary tone with arrows pointing outwards.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "horizontal-resize",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....o..o",
    "....o..o",
    "..#.o..o.#",
    ".#..o..o..#",
    "###.o..o.###",
    ".#..o..o..#",
    "..#.o..o.#",
    "....o..o",
    "....o..o",
  ],
};

export default icon;
