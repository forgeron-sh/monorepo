import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`cloud`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "cloud",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#........#",
    "#..........#",
    "#...oooo...#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
