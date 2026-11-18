import type { PixelIcon } from "../types";

// Monitor with a stop square on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-stop",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
