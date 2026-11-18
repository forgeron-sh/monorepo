import type { PixelIcon } from "../types";

// Greater-than sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "greater-than",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##",
    "....##",
    "......##",
    "........##",
    "........##",
    "......##",
    "....##",
    "..##",
  ],
};

export default icon;
