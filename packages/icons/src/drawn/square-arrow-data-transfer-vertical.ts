import type { PixelIcon } from "../types";

// Two opposite arrows, up and down, in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-data-transfer-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..o.....#",
    ".#.ooo.o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o.ooo.#",
    ".#.....o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
