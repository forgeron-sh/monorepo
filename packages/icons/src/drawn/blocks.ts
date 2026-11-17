import type { PixelIcon } from "../types";

// Three joined squares in an L, and a fourth one apart in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "blocks",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oooo",
    ".......o..o",
    ".......o..o",
    ".####..oooo",
    ".#..#",
    ".#..#",
    ".#######",
    ".#..#..#",
    ".#..#..#",
    ".#######",
  ],
};

export default icon;
