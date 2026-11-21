import type { PixelIcon } from "../types";

// An exclamation mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "exclamation-mark",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "",
    ".....##",
    ".....##",
  ],
};

export default icon;
