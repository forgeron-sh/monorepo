import type { PixelIcon } from "../types";

// Alarm clock with a minus badge: `alarm-clock` one column left, the badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alarm-clock-minus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##......##",
    "#..####..#",
    "..#....#",
    ".#..#...#",
    ".#..#...#",
    ".#..##",
    ".#",
    "..#",
    "...###.ooooo",
    "..#",
  ],
};

export default icon;
