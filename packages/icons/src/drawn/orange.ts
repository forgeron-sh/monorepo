import type { PixelIcon } from "../types";

// An orange: a round fruit with a leaf in the secondary tone on its stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "orange",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......#oo",
    "......#",
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
