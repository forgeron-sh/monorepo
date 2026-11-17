import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`lock`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "lock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
