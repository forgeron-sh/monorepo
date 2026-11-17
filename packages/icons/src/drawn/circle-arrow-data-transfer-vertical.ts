import type { PixelIcon } from "../types";

// Up and down arrows side by side in a ring, the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-data-transfer-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..o.....#",
    ".#.ooo.o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o.ooo.#",
    ".#.....o..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
