import type { PixelIcon } from "../types";

// Kerning: the letters V and A set close, over two arrows, in the secondary tone, pointing at each other.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-kerning",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...#..#",
    ".#...#.#.#",
    "..#.#..#.#",
    "..#.#.#####",
    "...#..#...#",
    "",
    "",
    "...o....o",
    ".oooo..oooo",
    "...o....o",
  ],
};

export default icon;
