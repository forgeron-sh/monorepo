import type { PixelIcon } from "../types";

// Mosque with two minarets: the shared dome and crescent finial between two minarets with balconies.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mosque-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o..o",
    ".#...oo...#",
    ".#..####..#",
    "###.#..#.###",
    ".#.#....#.#",
    ".#.#....#.#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#...##...#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
