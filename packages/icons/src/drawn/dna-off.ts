import type { PixelIcon } from "../types";

// DNA struck through: `dna` with a 45° slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "dna-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o.#......#",
    ".o.######",
    "..o.#..#",
    "...o.##",
    "....o..#",
    "...#.o..#",
    "..####o###",
    "...#...o#",
    "....#..#o",
    ".....##..o",
    "....#..#..o",
    "...######..o",
  ],
};

export default icon;
