import type { PixelIcon } from "../types";

// Projector casting a light cone under a floating shape.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hologram",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "....oooo",
    ".....oo",
    ".#........#",
    "..#......#",
    "...#....#",
    "....####",
    "...######",
    ".##########",
  ],
};

export default icon;
