import type { PixelIcon } from "../types";

// Layout: a window with a header and a footer band around the body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
