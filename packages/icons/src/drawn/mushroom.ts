import type { PixelIcon } from "../types";

// Mushroom: a domed cap filled in the secondary tone on a stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mushroom",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#oooooo#",
    ".#oooooooo#",
    ".#oooooooo#",
    "#oooooooooo#",
    ".##########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
