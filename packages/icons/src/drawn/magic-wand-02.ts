import type { PixelIcon } from "../types";

// Magic wand with a diamond star at its tip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "magic-wand-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........o",
    ".......ooo",
    "......ooooo",
    ".......ooo",
    "....##..o",
    "...##",
    "..##",
    ".##",
    "##",
  ],
};

export default icon;
