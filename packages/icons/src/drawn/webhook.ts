import type { PixelIcon } from "../types";

// Webhook: three rings joined in a triangle; the joins in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "webhook",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    "....o..o",
    "...o....o",
    "..##....##",
    ".#..#oo#..#",
    ".#..#..#..#",
    "..##....##",
  ],
};

export default icon;
