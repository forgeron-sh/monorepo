import type { PixelIcon } from "../types";

// An umbrella with a dollar sign: financial cover. Umbrella of `umbrella`, sign of `user-dollar`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "umbrella-dollar",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    ".##....##",
    "#........#",
    "#........#",
    "##########",
    ".....#",
    ".....#..oooo",
    ".....#.oo",
    "..#..#..ooo",
    "...##.....oo",
    ".......oooo",
  ],
};

export default icon;
