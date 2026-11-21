import type { PixelIcon } from "../types";

// Smart TV: a screen with a play triangle in the secondary tone, on a stand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tv-smart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...o....#",
    ".#...oo...#",
    ".#...ooo..#",
    ".#...oo...#",
    ".#...o....#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
