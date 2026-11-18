import type { PixelIcon } from "../types";

// The letters AR inside scan corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "augmented-reality-ar",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    "",
    "...o...oo",
    "..o.o..o.o",
    "..ooo..oo",
    "..o.o..o.o",
    "",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
