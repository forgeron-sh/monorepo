import type { PixelIcon } from "../types";

// Clipboard with a pencil badge and a short written line, `clipboard-pen` with a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clipboard-pen-line",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##.#..#.##",
    ".#..####..#",
    ".#........#",
    ".#",
    ".#.......oo",
    ".#......o.o",
    ".#.##..o.o",
    ".#....o.o",
    ".####.oo",
  ],
};

export default icon;
