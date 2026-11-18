import type { PixelIcon } from "../types";

// Alarm clock with a plus badge: `alarm-clock` one column left, the badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alarm-clock-plus",
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
    ".#.......o",
    "..#......o",
    "...###.ooooo",
    "..#......o",
    ".........o",
  ],
};

export default icon;
