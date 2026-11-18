import type { PixelIcon } from "../types";

// A stack of three folded towels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "towels",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    "..########",
    ".#........#",
    ".#........#",
    "..########",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
