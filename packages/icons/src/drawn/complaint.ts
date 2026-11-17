import type { PixelIcon } from "../types";

// Complaint: a speech bubble with an exclamation mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "complaint",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    ".#..#######",
    ".#.#",
    ".##",
  ],
};

export default icon;
