import type { PixelIcon } from "../types";

// Frame: two horizontal and two vertical lines crossing near the corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "frame",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    ".##########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    ".##########",
    "..#......#",
  ],
};

export default icon;
