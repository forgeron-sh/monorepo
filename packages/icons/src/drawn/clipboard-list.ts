import type { PixelIcon } from "../types";

// Clipboard with a bulleted list: the board and clip of `clipboard`, the bullets in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clipboard-list",
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
    ".#.o.####.#",
    ".#........#",
    ".#........#",
    ".#.o.###..#",
    ".##########",
  ],
};

export default icon;
