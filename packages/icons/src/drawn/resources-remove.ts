import type { PixelIcon } from "../types";

// Resources remove: three small shapes in a two-by-two grid, a minus in the secondary tone in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "resources-remove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..#..oooo",
    ".#..#..oooo",
    ".####",
    "",
    "",
    "..##...####",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##...####",
  ],
};

export default icon;
