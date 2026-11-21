import type { PixelIcon } from "../types";

// Hanging chandelier with two lit candles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "candelier-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    ".o...##...o",
    ".#...##...#",
    ".#...##...#",
    ".##..##..##",
    "..########",
    ".....##",
    "....####",
  ],
};

export default icon;
