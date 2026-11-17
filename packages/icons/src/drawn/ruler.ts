import type { PixelIcon } from "../types";

// Ruler: a bar with ticks, a two-pixel middle mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ruler",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    ".#.#.##.#.#",
    ".#...##...#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
