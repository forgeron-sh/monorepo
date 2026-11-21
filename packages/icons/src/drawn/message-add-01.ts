import type { PixelIcon } from "../types";

// Speech bubble (`message-01`) with a plus badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-add-01",
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
    "..#.#.ooooo",
    "..##....o",
    "........o",
  ],
};

export default icon;
