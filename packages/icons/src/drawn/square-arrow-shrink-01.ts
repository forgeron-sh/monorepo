import type { PixelIcon } from "../types";

// Two arrows pointing in to the centre in the frame of `square`: shrink.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-shrink-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....o.o.#",
    ".#....oo..#",
    ".#....ooo.#",
    ".#.ooo....#",
    ".#..oo....#",
    ".#.o.o....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
