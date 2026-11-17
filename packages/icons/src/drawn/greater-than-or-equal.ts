import type { PixelIcon } from "../types";

// Greater-than-or-equal sign: the angle over a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "greater-than-or-equal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    "....##",
    "......##",
    "........##",
    "........##",
    "......##",
    "....##",
    "..##",
    "",
    "..########",
  ],
};

export default icon;
