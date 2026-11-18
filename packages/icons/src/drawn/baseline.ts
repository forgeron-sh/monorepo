import type { PixelIcon } from "../types";

// Baseline: a letter A standing on a baseline drawn in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baseline",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "",
    ".oooooooooo",
  ],
};

export default icon;
