import type { PixelIcon } from "../types";

// Colour swatch: a card with a block of colour in the secondary tone over a label line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swatch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#oooooo#",
    "..#oooooo#",
    "..#oooooo#",
    "..########",
    "..#......#",
    "..#.###..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
