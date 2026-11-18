import type { PixelIcon } from "../types";

// The bot crossed by the off slash.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bot-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o...##",
    "..o..##",
    ".#.o.######",
    ".#..o.....#",
    "##.ooo.oo.##",
    "##.oo.ooo.##",
    ".#.....o..#",
    ".#..###.o.#",
    ".#.......o",
    ".########.o",
    "...........o",
  ],
};

export default icon;
