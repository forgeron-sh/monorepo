import type { PixelIcon } from "../types";

// Broken link: the two halves of `link-01` pulled apart and offset diagonally, each with the
// stub of its bar, symmetric by a half turn (side by side on one row they read as a face).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "unlink-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......####",
    "...........#",
    ".......##..#",
    ".####......#",
    "#......####",
    "#..##",
    "#",
    ".####",
  ],
};

export default icon;
