import type { PixelIcon } from "../types";

// Fanous: the Ramadan lantern with a ring, a pointed cap, a flame in the secondary tone and a tapered foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ramadhan-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    "...#....#",
    "..########",
    "...#....#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "..########",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
