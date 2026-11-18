import type { PixelIcon } from "../types";

// Shopping bag: a bag tapering out to the bottom, the handle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-bag-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...o....o",
    "...o....o",
    "..########",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
