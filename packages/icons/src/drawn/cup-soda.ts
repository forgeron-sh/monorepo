import type { PixelIcon } from "../types";

// Soda cup: a tapered cup with a lid and a straw in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cup-soda",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........o",
    ".......o",
    "...######",
    ".##########",
    "..#......#",
    "..#......#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
