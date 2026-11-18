import type { PixelIcon } from "../types";

// Square panel with its bottom strip in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-bottom",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
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
