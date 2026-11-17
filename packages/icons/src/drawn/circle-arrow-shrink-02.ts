import type { PixelIcon } from "../types";

// `circle-arrow-shrink-01` mirrored: the same arrows on the other diagonal, upper left to lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-shrink-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.o.o....#",
    ".#..oo....#",
    ".#.ooo....#",
    ".#....ooo.#",
    ".#....oo..#",
    ".#....o.o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
