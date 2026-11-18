import type { PixelIcon } from "../types";

// Island: a palm tree on a mound above waves in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "island",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###.###",
    ".#...#...#",
    "#....#....#",
    ".....#",
    "......#",
    "......#",
    "....####",
    "..##....##",
    "",
    ".oo..oo..oo",
    "o..oo..oo..o",
  ],
};

export default icon;
