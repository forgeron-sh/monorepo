import type { PixelIcon } from "../types";

// Brain of `brain-01` without its folds, with the cog badge of `computer-settings` in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brain-cog",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#..##..#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#",
    "...###..o.o",
    ".....#.ooooo",
    ".....#.oo.oo",
    ".......ooooo",
    "........o.o",
  ],
};

export default icon;
