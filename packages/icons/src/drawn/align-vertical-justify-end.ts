import type { PixelIcon } from "../types";

// Vertical justify end: `align-horizontal-justify-end` turned a quarter, the guides in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-vertical-justify-end",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...######",
    "",
    "",
    "..########",
    "..#......#",
    "..########",
    "",
    ".oooooooooo",
  ],
};

export default icon;
