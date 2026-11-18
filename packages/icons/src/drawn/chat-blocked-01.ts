import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with the badge of `chat-blocked` in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-blocked-01",
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
    "..#...o..oo",
    "..#.#.o.o.o",
    "..##..oo..o",
    ".......ooo",
  ],
};

export default icon;
