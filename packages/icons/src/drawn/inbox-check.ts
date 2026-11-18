import type { PixelIcon } from "../types";

// Inbox tray with a check in the secondary tone above the tray line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inbox-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.....o..#",
    ".#..o.o...#",
    ".#...o....#",
    ".#........#",
    ".###....###",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
