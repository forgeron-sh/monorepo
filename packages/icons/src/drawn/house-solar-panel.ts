import type { PixelIcon } from "../types";

// House whose roof is a solar panel, drawn in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "house-solar-panel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oooooooo",
    "..o..oo..o",
    ".oooooooooo",
    ".o...oo...o",
    "oooooooooooo",
    ".#........#",
    ".#...##...#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
