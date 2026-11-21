import type { PixelIcon } from "../types";

// Bell electric: a bell with a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bell-electric",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    ".....##..o",
    "....#...ooo",
    "...#.....o",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".##########",
    "",
    ".....##",
  ],
};

export default icon;
