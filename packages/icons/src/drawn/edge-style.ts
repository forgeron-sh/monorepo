import type { PixelIcon } from "../types";

// Corner style: a rounded corner, the square corner it replaces marked in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "edge-style",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo..#######",
    ".o.##",
    "..#",
    "..#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
  ],
};

export default icon;
