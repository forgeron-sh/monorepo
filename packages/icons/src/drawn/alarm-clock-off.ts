import type { PixelIcon } from "../types";

// Alarm off: `alarm-clock` struck by a 45° slash in the secondary tone, cut out of the clock with a one-pixel clearance.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alarm-clock-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o.......##",
    "..o..###..#",
    "...o....#",
    "....o....#",
    "..#..o...#",
    "..#...o..#",
    "..#....o",
    "...#....o",
    "....###..o",
    "...#......o",
    "...........o",
  ],
};

export default icon;
