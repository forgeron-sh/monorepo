import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with a padlock badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-lock-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#.....ooo",
    "..#....o.o",
    "..#.#.ooooo",
    "..##..ooooo",
    "......ooooo",
  ],
};

export default icon;
