import type { PixelIcon } from "../types";

// Light move: a one-pixel cross with a small arrowhead at each end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    ".....###",
    "......#",
    "......#",
    "..#...#...#",
    ".###########",
    "..#...#...#",
    "......#",
    "......#",
    ".....###",
    "......#",
  ],
};

export default icon;
