import type { PixelIcon } from "../types";

// Laughing face: two eyes and an open grin in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "happy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#.oooooo.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
