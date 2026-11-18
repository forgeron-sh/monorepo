import type { PixelIcon } from "../types";

// Mosque with one minaret: the shared dome and crescent finial of `mosque-01`, a minaret with a balcony on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mosque-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o..o...#",
    "....oo....#",
    "...####..###",
    "..#....#..#",
    ".#......#.#",
    ".#......#.#",
    "###########",
    "#.........#",
    "#.........#",
    "#...##....#",
    "#..#..#...#",
    "####..#####",
  ],
};

export default icon;
