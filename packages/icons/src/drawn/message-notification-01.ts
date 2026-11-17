import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with a notification dot in the secondary tone, upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-notification-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######.oo",
    ".#.......oo",
    ".#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
