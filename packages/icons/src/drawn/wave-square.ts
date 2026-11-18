import type { PixelIcon } from "../types";

// Square wave: a signal stepping between two levels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wave-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...####..###",
    "...#..#..#",
    "...#..#..#",
    "...#..#..#",
    "...#..#..#",
    "####..####",
  ],
};

export default icon;
