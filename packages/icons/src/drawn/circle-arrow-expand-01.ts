import type { PixelIcon } from "../types";

// Two corner arrows pointing out, upper right and lower left, in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-expand-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....ooo.#",
    ".#.....oo.#",
    ".#......o.#",
    ".#.o......#",
    ".#.oo.....#",
    ".#.ooo....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
