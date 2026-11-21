import type { PixelIcon } from "../types";

// A sticker: a square with its lower right corner peeled back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sticker",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#...ooooo#",
    ".#...o...#",
    ".#...o..#",
    ".#...o.#",
    ".#...o#",
    "..####",
  ],
};

export default icon;
