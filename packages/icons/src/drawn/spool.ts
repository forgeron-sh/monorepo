import type { PixelIcon } from "../types";

// Spool of thread: two flanges and the wound thread in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "spool",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "...#....#",
    "...#oooo#",
    "...#....#",
    "...#oooo#",
    "...#....#",
    "...#oooo#",
    "...#....#",
    "..########",
  ],
};

export default icon;
