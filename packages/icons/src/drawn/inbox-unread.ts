import type { PixelIcon } from "../types";

// Inbox tray of `inbox` with an unread dot in the secondary tone, its corner cut back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inbox-unread",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........oo",
    ".#######.oo",
    ".#",
    ".#........#",
    ".#........#",
    ".###....###",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
