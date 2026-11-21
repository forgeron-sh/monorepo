import type { PixelIcon } from "../types";

// Heart with a pulse: the heart outline crossed by a heartbeat line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heart-pulse",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###..###",
    ".#...##...#",
    ".#....o...#",
    ".#...o.o..#",
    "oooooo..ooo",
    "..#.....o#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
