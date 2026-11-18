import type { PixelIcon } from "../types";

// Jupiter: a round planet with two bands across it and the Great Red Spot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "jupiter",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    "..#......#",
    ".##########",
    ".#....oo..#",
    ".#....oo..#",
    ".##########",
    "..#......#",
    "..##....##",
    "....####",
  ],
};

export default icon;
