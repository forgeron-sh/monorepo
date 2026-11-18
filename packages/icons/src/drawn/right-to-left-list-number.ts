import type { PixelIcon } from "../types";

// Right-to-left numbered list: lines on the left, the numbers 1 and 2 on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-to-left-list-number",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........o",
    ".#####..oo",
    ".........o",
    "..####..ooo",
    "",
    "",
    "........oo",
    ".#####....o",
    ".........o",
    "..####..ooo",
  ],
};

export default icon;
