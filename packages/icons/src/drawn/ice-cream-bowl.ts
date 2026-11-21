import type { PixelIcon } from "../types";

// Ice cream sundae: a scoop in the secondary tone in a footed bowl.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ice-cream-bowl",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....oooo",
    "..oo....oo",
    ".o........o",
    "############",
    "#..........#",
    ".#........#",
    "..##....##",
    "....####",
    "...######",
  ],
};

export default icon;
