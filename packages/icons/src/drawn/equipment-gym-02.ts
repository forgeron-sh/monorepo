import type { PixelIcon } from "../types";

// A dumbbell: two round weights joined by a short bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equipment-gym-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##......##",
    "#..#....#..#",
    "#..######..#",
    "#..######..#",
    "#..#....#..#",
    ".##......##",
  ],
};

export default icon;
