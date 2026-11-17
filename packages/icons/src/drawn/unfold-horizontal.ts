import type { PixelIcon } from "../types";

// Two arrows pointing away from a fold line in the secondary tone: unfold sideways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "unfold-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....oo",
    "..#..oo..#",
    ".#...oo...#",
    "####.oo.####",
    ".#...oo...#",
    "..#..oo..#",
    ".....oo",
  ],
};

export default icon;
