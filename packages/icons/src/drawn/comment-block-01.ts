import type { PixelIcon } from "../types";

// The speech bubble of `comment-01` with the block badge of `file-block`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comment-block-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#......ooo",
    "..#..#.o..oo",
    "..#.#..o.o.o",
    "..##...oo..o",
    "........ooo",
  ],
};

export default icon;
