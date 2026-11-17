import type { PixelIcon } from "../types";

// Roller skate: the sneaker profile on two wheels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "roller-skate",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".####",
    ".#...#",
    ".#....##",
    ".#......##",
    ".#........#",
    ".##########",
    "",
    "..oo....oo",
    "..oo....oo",
  ],
};

export default icon;
