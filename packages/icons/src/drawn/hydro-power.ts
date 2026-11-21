import type { PixelIcon } from "../types";

// Hydro power: the drop of `rain-drop` with a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hydro-power",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....#..#",
    "...#..o.#",
    "...#.o..#",
    "..#.oooo.#",
    "..#...o..#",
    "..#..o...#",
    "...#....#",
    "....####",
  ],
};

export default icon;
