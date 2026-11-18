import type { PixelIcon } from "../types";

// Kurta: a long tunic with long sleeves, the neck placket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kurta",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    ".##..##..##",
    "#....oo....#",
    "#.#..oo..#.#",
    "#.#......#.#",
    "#.#......#.#",
    "###......###",
    "..#......#",
    "..#......#",
    "..#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
