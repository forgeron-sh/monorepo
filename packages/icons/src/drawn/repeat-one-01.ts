import type { PixelIcon } from "../types";

// Repeat once: the repeat loop with a small 1 inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "repeat-one-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    ".##########",
    ".#.......#",
    ".#...oo.#",
    "...#..o...#",
    "..#..ooo..#",
    ".##########",
    "..#",
    "...#",
  ],
};

export default icon;
