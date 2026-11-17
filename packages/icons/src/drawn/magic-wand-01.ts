import type { PixelIcon } from "../types";

// Magic wand: a two-pixel wand at 45° and a sparkle in the secondary tone at its tip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "magic-wand-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........o",
    "........ooo",
    ".........o",
    "",
    "......##",
    ".....##",
    "....##",
    "...##",
    "..##",
    ".##",
  ],
};

export default icon;
