import type { PixelIcon } from "../types";

// Clipboard with a capital T in the secondary tone, the board of `clipboard`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clipboard-type",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##.#..#.##",
    ".#..####..#",
    ".#........#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
