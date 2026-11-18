import type { PixelIcon } from "../types";

// Rabbit sitting, seen from the side: two long ears laid back, a round head, a round body and a tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rabbit",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......##",
    ".....#.#",
    "....#.#",
    "..###.#",
    ".#....#",
    ".#.....###",
    "..##......#",
    "...#.......#",
    "...#.......#",
    "...#......#",
    "....######",
  ],
};

export default icon;
