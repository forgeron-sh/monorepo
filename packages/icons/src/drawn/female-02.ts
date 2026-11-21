import type { PixelIcon } from "../types";

// Female symbol: a ring over a short cross.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "female-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....###",
    "....#...#",
    "...#.....#",
    "...#.....#",
    "...#.....#",
    "....#...#",
    ".....###",
    "......#",
    "....#####",
    "......#",
    "......#",
  ],
};

export default icon;
