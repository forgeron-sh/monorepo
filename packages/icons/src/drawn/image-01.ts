import type { PixelIcon } from "../types";

// Picture: a frame, a sun in the secondary tone, two peaks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.....oo.#",
    ".#.....oo.#",
    ".#........#",
    ".#........#",
    ".#...#....#",
    ".#..###.#.#",
    ".#.########",
    ".##########",
  ],
};

export default icon;
