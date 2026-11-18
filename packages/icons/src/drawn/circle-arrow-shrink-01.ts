import type { PixelIcon } from "../types";

// Two corner arrows pointing in to the centre, in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-shrink-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....o.o.#",
    ".#....oo..#",
    ".#....ooo.#",
    ".#.ooo....#",
    ".#..oo....#",
    ".#.o.o....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
