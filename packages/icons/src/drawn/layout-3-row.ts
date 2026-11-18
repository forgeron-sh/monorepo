import type { PixelIcon } from "../types";

// Frame split into three rows.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-3-row",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
