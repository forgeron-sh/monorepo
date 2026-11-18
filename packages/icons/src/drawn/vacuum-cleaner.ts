import type { PixelIcon } from "../types";

// Upright vacuum cleaner: grip, handle, body with a dust bag, floor head.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vacuum-cleaner",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......###",
    "........#",
    "........#",
    "........#",
    "....#####",
    "....#...#",
    "....#.o.#",
    "....#...#",
    "....#####",
    "......#",
    "..#######",
  ],
};

export default icon;
