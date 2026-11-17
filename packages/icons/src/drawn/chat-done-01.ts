import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with the badge of `chat-done` in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-done-01",
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
    ".#........o",
    "..#......o",
    "..#.#.o.o",
    "..##...o",
  ],
};

export default icon;
