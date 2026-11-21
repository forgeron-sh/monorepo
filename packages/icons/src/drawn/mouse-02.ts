import type { PixelIcon } from "../types";

// Two-button mouse: the body of `mouse-01`, one pixel wider, split by a line between the buttons, no wheel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#####",
    "...#..#..#",
    "...#..#..#",
    "...#..#..#",
    "...#######",
    "...#.....#",
    "...#.....#",
    "...#.....#",
    "...#.....#",
    "....#####",
  ],
};

export default icon;
