import type { PixelIcon } from "../types";

// Search engine optimisation: the lens of `search-01` with two rising bars inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "seo",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....#",
    "#...o..#",
    "#.o.o..#",
    "#.o.o..#",
    ".#....#",
    "..######",
    "......###",
    ".......###",
    "........##",
  ],
};

export default icon;
