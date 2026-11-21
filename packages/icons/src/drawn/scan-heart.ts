import type { PixelIcon } from "../types";

// Scan a heart: the brackets of `scan` round a heart in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scan-heart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "...oo..oo",
    "..oooooooo",
    "..oooooooo",
    "...oooooo",
    ".#..oooo..#",
    ".#...oo...#",
    ".###....###",
  ],
};

export default icon;
