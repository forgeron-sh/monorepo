import type { PixelIcon } from "../types";

// Rupee on a shield: the shield-01 outline with the rupee sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rupee-shield",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..ooooo.#",
    ".#.....o..#",
    ".#..ooooo.#",
    ".#...oo...#",
    ".#....oo..#",
    "..#....oo#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
