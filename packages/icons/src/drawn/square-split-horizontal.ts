import type { PixelIcon } from "../types";

// A square split into left and right halves by a bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-split-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##.oo.##",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    "..##.oo.##",
  ],
};

export default icon;
