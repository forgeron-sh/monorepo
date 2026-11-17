import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with the badge of `chat-unlock` in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-unlock-01",
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
    "..#....o",
    "..#.#.ooooo",
    "..##..ooooo",
    "......ooooo",
  ],
};

export default icon;
