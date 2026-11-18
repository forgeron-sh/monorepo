import type { PixelIcon } from "../types";

// Anchor point: a square node on a tangent, its two handles at the ends.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "anchor-point",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##",
    ".##",
    "...#",
    "....oooo",
    "....o..o",
    "....o..o",
    "....oooo",
    "........#",
    ".........##",
    ".........##",
  ],
};

export default icon;
