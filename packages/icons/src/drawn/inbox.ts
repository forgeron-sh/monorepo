import type { PixelIcon } from "../types";

// Inbox: a box whose lower part dips into a tray.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inbox",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".###....###",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
