import type { PixelIcon } from "../types";

// Victory sign: the index and middle fingers of `hand` spread into a V, the other two folded on the palm.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "victory-finger-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#.....#",
    "..#.....#",
    "...#...#",
    "...#...#",
    "....#.#.#.#",
    "....#######",
    "....#######",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
