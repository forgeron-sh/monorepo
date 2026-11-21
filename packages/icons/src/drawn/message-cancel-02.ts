import type { PixelIcon } from "../types";

// Speech bubble with a cross inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-cancel-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
