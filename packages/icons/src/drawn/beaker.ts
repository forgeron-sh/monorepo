import type { PixelIcon } from "../types";

// Beaker: a lip, straight walls, the liquid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "beaker",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#oooooo#",
    "..#oooooo#",
    "..#oooooo#",
    "..#oooooo#",
    "..########",
  ],
};

export default icon;
