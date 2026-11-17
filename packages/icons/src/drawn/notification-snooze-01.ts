import type { PixelIcon } from "../types";

// Bell (`notification-01`) with a Z in the secondary tone, upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notification-snooze-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    ".....##...o",
    "....#....o",
    "...#....ooo",
    "...#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".##########",
    "",
    ".....##",
  ],
};

export default icon;
