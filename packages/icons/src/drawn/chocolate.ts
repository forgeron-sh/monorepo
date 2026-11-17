import type { PixelIcon } from "../types";

// Chocolate bar: a grid of six squares, its wrapper in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chocolate",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".oooooooooo",
    ".o........o",
    ".o........o",
    ".oooooooooo",
  ],
};

export default icon;
