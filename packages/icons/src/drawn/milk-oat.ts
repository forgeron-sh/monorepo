import type { PixelIcon } from "../types";

// Oat milk: the carton of `milk-carton` with an oat grain on its front in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "milk-oat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#####",
    "...#...#.#",
    "..#...#...#",
    "..#####...#",
    "..#...#...#",
    "..#.o.#...#",
    "..#ooo#...#",
    "..#ooo#...#",
    "..#.o.#..#",
    "..#####.#",
  ],
};

export default icon;
