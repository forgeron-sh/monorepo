import type { PixelIcon } from "../types";

// A backboard with a hoop and net.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "basketball-hoop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..####..#",
    ".#..#..#..#",
    ".##########",
    "..oooooooo",
    "...#....#",
    "...#.##.#",
    "....#..#",
    "....####",
  ],
};

export default icon;
