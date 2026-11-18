import type { PixelIcon } from "../types";

// Umbrella: a domed canopy and a hooked handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "umbrella",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    ".##########",
    "......#",
    "......#",
    "......#",
    "...#..#",
    "....##",
  ],
};

export default icon;
