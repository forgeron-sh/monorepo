import type { PixelIcon } from "../types";

// Resources add: three small shapes in a two-by-two grid, a plus in the secondary tone in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "resources-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####...oo",
    ".#..#..oooo",
    ".#..#..oooo",
    ".####...oo",
    "",
    "",
    "..##...####",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##...####",
  ],
};

export default icon;
