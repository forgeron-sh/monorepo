import type { PixelIcon } from "../types";

// Play triangle in the box of `add-square`, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "play-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...o....#",
    ".#...oo...#",
    ".#...ooo..#",
    ".#...ooo..#",
    ".#...oo...#",
    ".#...o....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
