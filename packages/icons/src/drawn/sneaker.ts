import type { PixelIcon } from "../types";

// Sneaker: a low shoe seen from the side, the sole in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sneaker",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####",
    ".#...#",
    ".#....##",
    ".#......##",
    ".#........#",
    ".##########",
    ".oooooooooo",
  ],
};

export default icon;
