import type { PixelIcon } from "../types";

// Person in the full-grid ring of `circle`, the shoulders running into the ring, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-circle-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#..o..o..#",
    "#...o..o...#",
    "#....oo....#",
    "#..........#",
    "#..######..#",
    ".##......##",
    ".##......##",
    "..##....##",
    "....####",
  ],
};

export default icon;
