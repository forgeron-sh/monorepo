import type { PixelIcon } from "../types";

// The cupcake of `cupcake-01` with a birthday candle in the secondary tone instead of the cherry.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cupcake-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......o",
    ".....oo",
    ".....oo",
    "...######",
    "..#......#",
    ".#........#",
    "############",
    ".#..#..#..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..########",
  ],
};

export default icon;
