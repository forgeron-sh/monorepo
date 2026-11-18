import type { PixelIcon } from "../types";

// Heater: a radiator panel with vertical fins on feet, three wisps of heat in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heater",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..o..o..o",
    "...o..o..o",
    "..o..o..o",
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
