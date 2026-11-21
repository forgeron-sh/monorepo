import type { PixelIcon } from "../types";

// Radio button: the ring of `clock-01` and a round dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "radio-button",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
