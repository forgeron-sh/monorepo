import type { PixelIcon } from "../types";

// Page with a dog-ear, two lines of text and a signature line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "contracts",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#.###..#",
    "..#......#",
    "..#.oooo.#",
    "..########",
  ],
};

export default icon;
