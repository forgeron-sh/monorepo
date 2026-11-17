import type { PixelIcon } from "../types";

// Monitor of `computer-add` showing a solid shield in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-protection",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
