import type { PixelIcon } from "../types";

// Two wide rectangles stacked, stretched across the full width.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stretch-horizontal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
