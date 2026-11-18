import type { PixelIcon } from "../types";

// Patio parasol over a small table.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "patio",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".##########",
    "......#",
    "......#",
    "......#",
    "..########",
    "...#....#",
    "...#....#",
  ],
};

export default icon;
