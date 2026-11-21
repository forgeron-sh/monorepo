import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`mcp`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "mcp",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#....#",
    "...#....#",
    "...#....#",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    "..#......#",
    "...######",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
