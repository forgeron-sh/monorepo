import type { PixelIcon } from "../types";

// Three rising bars with a trend line above them in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-bar-line",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........o",
    ".......o.o",
    "..o...o...o",
    ".o.o.o",
    "o...o..##",
    ".......##",
    "....##.##",
    ".##.##.##",
    ".##.##.##",
    ".##.##.##",
  ],
};

export default icon;
