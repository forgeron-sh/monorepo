import type { PixelIcon } from "../types";

// Subscript: a letter X with a small 2 below on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "subscript",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##....##",
    ".##..##",
    "..####",
    "...##",
    "..####",
    ".##..##",
    "##....##.ooo",
    "...........o",
    ".........ooo",
    ".........o",
    ".........ooo",
  ],
};

export default icon;
