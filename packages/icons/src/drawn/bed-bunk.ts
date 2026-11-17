import type { PixelIcon } from "../types";

// Bunk bed seen from the side: two posts, two bunks, a pillow on each in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bed-bunk",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    ".#.oo.....#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#.oo.....#",
    ".##########",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
