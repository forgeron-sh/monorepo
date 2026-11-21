import type { PixelIcon } from "../types";

// Monitor showing a small person, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-user",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
