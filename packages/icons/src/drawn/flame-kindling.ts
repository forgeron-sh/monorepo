import type { PixelIcon } from "../types";

// Kindling: a small flame with its core in the secondary tone over two crossed sticks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flame-kindling",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#",
    "....##",
    "....#.#",
    "...#...#",
    "...#.o.#",
    "...#ooo#",
    "....###",
    "",
    ".##......##",
    "...##..##",
    ".....##",
    "...##..##",
  ],
};

export default icon;
