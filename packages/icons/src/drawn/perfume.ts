import type { PixelIcon } from "../types";

// Perfume bottle: a solid cap in the secondary tone, a short neck, a rounded body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "perfume",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "....oooo",
    ".....##",
    "...######",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...######",
  ],
};

export default icon;
