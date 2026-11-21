import type { PixelIcon } from "../types";

// Superscript: a letter X with a small 2 above on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "superscript",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........ooo",
    "...........o",
    ".........ooo",
    ".........o",
    "##....##.ooo",
    ".##..##",
    "..####",
    "...##",
    "..####",
    ".##..##",
    "##....##",
  ],
};

export default icon;
