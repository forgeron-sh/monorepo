import type { PixelIcon } from "../types";

// Area chart: axes with a filled area under a wavy line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-area",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#........o",
    ".#.......oo",
    ".#..o...ooo",
    ".#.ooo.oooo",
    ".#ooooooooo",
    ".#ooooooooo",
    ".#ooooooooo",
    ".##########",
  ],
};

export default icon;
