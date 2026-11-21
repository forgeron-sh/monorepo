import type { PixelIcon } from "../types";

// Vertical justify start: `align-horizontal-justify-start` turned a quarter, the guides in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-vertical-justify-start",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    "",
    "..########",
    "..#......#",
    "..########",
    "",
    "",
    "...######",
    "...#....#",
    "...######",
  ],
};

export default icon;
