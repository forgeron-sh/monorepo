import type { PixelIcon } from "../types";

// Window with a title bar and a small pointer inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-in-window",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#..o.....#",
    ".#..oo....#",
    ".#..ooo...#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
