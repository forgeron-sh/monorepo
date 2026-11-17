import type { PixelIcon } from "../types";

// Person with an open-bottomed shoulder arc, the head in the secondary tone: `user` without the base line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...o....o",
    "...o....o",
    "...o....o",
    "....oooo",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
