import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with a download arrow badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-download-01",
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
    ".#......o",
    "..#.....o",
    "..#.#.o.o.o",
    "..##...ooo",
    "........o",
  ],
};

export default icon;
