import type { PixelIcon } from "../types";

// Filing cabinet: two drawers, the handles in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "archive-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
