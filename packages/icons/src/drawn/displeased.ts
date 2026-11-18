import type { PixelIcon } from "../types";

// Displeased face: half-closed eyes and a flat mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "displeased",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
