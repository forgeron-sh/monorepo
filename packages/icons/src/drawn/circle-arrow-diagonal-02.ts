import type { PixelIcon } from "../types";

// `circle-arrow-diagonal-01` mirrored: the same arrows on the other diagonal, upper left to lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-diagonal-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.ooo....#",
    ".#.oo.....#",
    ".#.o.o....#",
    ".#....o.o.#",
    ".#.....oo.#",
    ".#....ooo.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
