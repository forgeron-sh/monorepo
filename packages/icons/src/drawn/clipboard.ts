import type { PixelIcon } from "../types";

// Clipboard: a board, its clip on top, two lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clipboard",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##.#..#.##",
    ".#..####..#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
