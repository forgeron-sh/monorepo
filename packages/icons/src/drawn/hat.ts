import type { PixelIcon } from "../types";

// Hat: a crown with a band in the secondary tone over a brim curled up at both ends.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "...oooooo",
    ".#........#",
    "..########",
  ],
};

export default icon;
