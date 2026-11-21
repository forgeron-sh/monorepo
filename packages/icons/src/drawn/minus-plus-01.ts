import type { PixelIcon } from "../types";

// Plus-minus sign, two-pixel bars.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minus-plus-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "..########",
    "..########",
    ".....##",
    ".....##",
    "",
    "",
    "..########",
    "..########",
  ],
};

export default icon;
