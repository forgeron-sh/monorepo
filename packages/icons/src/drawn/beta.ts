import type { PixelIcon } from "../types";

// The Greek letter beta: a tall stem with two bowls on its right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "beta",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    "...#...#",
    "...#...#",
    "...#.##",
    "...#...#",
    "...#....#",
    "...#....#",
    "...#...#",
    "...####",
    "...#",
    "...#",
  ],
};

export default icon;
