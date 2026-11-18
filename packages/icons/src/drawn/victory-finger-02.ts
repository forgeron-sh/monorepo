import type { PixelIcon } from "../types";

// Victory sign with the thumb: the V of `victory-finger-01` with the thumb of `hand` out at 45°.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "victory-finger-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#.....#",
    "..#.....#",
    "...#...#",
    "...#...#",
    ".#..#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
