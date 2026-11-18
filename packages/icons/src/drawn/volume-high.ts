import type { PixelIcon } from "../types";

// Speaker with two sound waves, 10×8 and centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the largest wave.
const icon: PixelIcon = {
  name: "volume-high",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....#..o",
    "....##...o",
    ".###.#.#..o",
    ".#...#..#.o",
    ".#...#..#.o",
    ".###.#.#..o",
    "....##...o",
    ".....#..o",
  ],
};

export default icon;
