import type { PixelIcon } from "../types";

// Straight join: the L outline of `join-bevel` with a square outer corner in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "join-straight",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#...#",
    ".#...#",
    ".#...######",
    ".#........#",
    ".o........#",
    ".o........#",
    ".o........#",
    ".oooo######",
  ],
};

export default icon;
