import type { PixelIcon } from "../types";

// Tree: a round canopy on a trunk in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tree-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
