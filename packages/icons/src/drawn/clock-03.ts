import type { PixelIcon } from "../types";

// Square clock: the rounded box of `checkmark-square-01` with the hands of `clock-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...o....#",
    ".#...o....#",
    ".#...o....#",
    ".#...oooo.#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
