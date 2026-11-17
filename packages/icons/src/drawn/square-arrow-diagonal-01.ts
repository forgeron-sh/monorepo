import type { PixelIcon } from "../types";

// A diagonal double-headed arrow in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-diagonal-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....ooo.#",
    ".#.....oo.#",
    ".#....o.o.#",
    ".#...o....#",
    ".#.o.o....#",
    ".#.oo.....#",
    ".#.ooo....#",
    "..########",
  ],
};

export default icon;
