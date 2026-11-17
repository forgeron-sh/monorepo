import type { PixelIcon } from "../types";

// Vertical space around: `align-horizontal-space-around` turned a quarter, the guides in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-vertical-space-around",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    "",
    "",
    "...######",
    "...#....#",
    "...#....#",
    "...######",
    "",
    "",
    ".oooooooooo",
  ],
};

export default icon;
