import type { PixelIcon } from "../types";

// Barber chair: a headrest on a tall back, an armrest over the seat, a footrest, one column on a round base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chair-barber",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##",
    ".##",
    "..#",
    "..#..####",
    "..#.....#",
    "..########",
    "......#.#",
    "......#..##",
    "......#",
    "....#####",
  ],
};

export default icon;
