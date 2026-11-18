import type { PixelIcon } from "../types";

// Monitor with a play triangle on its screen, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-video",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oo....#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oo....#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
