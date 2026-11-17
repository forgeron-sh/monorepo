import type { PixelIcon } from "../types";

// The scroll anchor of `diagonal-scroll-point-01` with two arrowheads only, on one diagonal.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "diagonal-scroll-point-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".##",
    ".#.#",
    "",
    ".....oo",
    ".....oo",
    "",
    "........#.#",
    ".........##",
    "........###",
  ],
};

export default icon;
