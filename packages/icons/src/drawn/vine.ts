import type { PixelIcon } from "../types";

// The Vine mark: a v whose right arm rises and curls back into a loop.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "vine",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##.....###",
    "##....#..##",
    ".##...#..##",
    ".##....###",
    "..##..##",
    "..##.##",
    "...####",
    "...###",
    "....#",
  ],
};

export default icon;
