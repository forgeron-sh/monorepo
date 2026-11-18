import type { PixelIcon } from "../types";

// A mountain with a flag planted on its peak, the flag in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "adventure",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#ooo",
    "....#ooo",
    "....#",
    "...#.#",
    "..#...#",
    "..#...#.#",
    ".#.....#.#",
    ".#........#",
    "#..........#",
    "############",
  ],
};

export default icon;
