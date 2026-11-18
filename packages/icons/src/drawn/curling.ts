import type { PixelIcon } from "../types";

// Curling stone: a wide rounded stone with a band in the secondary tone, the handle on top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "curling",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "...#",
    "..########",
    ".#........#",
    ".#oooooooo#",
    ".#........#",
    "..########",
  ],
};

export default icon;
