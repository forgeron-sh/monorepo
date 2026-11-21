import type { PixelIcon } from "../types";

// Window with a panel on the right, the panel in the secondary tone: `sidebar-left` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sidebar-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#.....#oo#",
    ".#.....#oo#",
    ".#.....#oo#",
    ".#.....#oo#",
    ".#.....#oo#",
    ".#.....#oo#",
    ".##########",
  ],
};

export default icon;
