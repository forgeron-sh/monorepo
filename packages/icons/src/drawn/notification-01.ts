import type { PixelIcon } from "../types";

// Bell: a domed body widening to a rim, the clapper below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the clapper.
const icon: PixelIcon = {
  name: "notification-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".##########",
    "",
    ".....oo",
  ],
};

export default icon;
