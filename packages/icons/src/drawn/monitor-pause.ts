import type { PixelIcon } from "../types";

// Monitor with pause bars on its screen, the computer of `computer-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-pause",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
