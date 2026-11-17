import type { PixelIcon } from "../types";

// Locked globe: `globe` cut at the lower right for a lock badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "earth-lock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..###..###",
    "..#.#..#.#",
    ".#..#..#..#",
    ".#########",
    ".#####",
    ".#..#....ooo",
    "..#.#....o.o",
    "..###...oooo",
    "....##..oooo",
    "........oooo",
  ],
};

export default icon;
