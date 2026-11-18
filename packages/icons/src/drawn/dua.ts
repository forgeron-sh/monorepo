import type { PixelIcon } from "../types";

// Dua: a person with both hands raised, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "dua",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "..#..oo..#",
    "..#......#",
    "..#.####.#",
    "..########",
    "....####",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
  ],
};

export default icon;
