import type { PixelIcon } from "../types";

// Latitude: the ring of `globe` crossed by two parallels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "latitude",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    "..#......#",
    ".#oooooooo#",
    ".#........#",
    ".#........#",
    ".#oooooooo#",
    "..#......#",
    "..##....##",
    "....####",
  ],
};

export default icon;
