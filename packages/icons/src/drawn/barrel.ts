import type { PixelIcon } from "../types";

// Barrel: a bulging body between two hoops.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "barrel",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".##########",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##########",
    ".#........#",
    "..########",
  ],
};

export default icon;
