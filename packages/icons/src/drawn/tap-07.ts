import type { PixelIcon } from "../types";

// Long press: the pointing hand of the set, cut at the wrist, under a short arc beside a small clock.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tap-07",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    ".......o.o.o",
    "..ooo..o.o.o",
    ".o...o.o...o",
    "........ooo",
    "...#",
    "...#",
    "#..#.#.#.#",
    ".#.#######",
    "..########",
    "...#######",
    "....#####",
  ],
};

export default icon;
