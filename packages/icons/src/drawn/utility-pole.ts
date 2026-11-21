import type { PixelIcon } from "../types";

// Utility pole: a post with two crossarms carrying insulators.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "utility-pole",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...##...#",
    ".##########",
    ".....##",
    "...#.##.#",
    "...######",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "....####",
  ],
};

export default icon;
