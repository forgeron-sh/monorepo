import type { PixelIcon } from "../types";

// Man: a pictogram with a head in the secondary tone, arms, body and legs (no face).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "man",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "",
    "...######",
    "..#.####.#",
    "..#.####.#",
    "..#.####.#",
    "....#..#",
    "....#..#",
    "....#..#",
  ],
};

export default icon;
