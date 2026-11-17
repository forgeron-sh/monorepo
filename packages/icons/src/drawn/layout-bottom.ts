import type { PixelIcon } from "../types";

// Window with a panel along the bottom, the panel in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-bottom",
  implemented: true,
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
    ".##########",
    ".#oooooooo#",
    ".#oooooooo#",
    ".##########",
  ],
};

export default icon;
