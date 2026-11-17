import type { PixelIcon } from "../types";

// Globe with a pencil badge: the globe cut back at the lower right around a pencil in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "global-editing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..###..###",
    "..#.#..#.#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#",
    "..#.#.....oo",
    "..###....oo",
    "....##..oo",
    ".......oo",
    ".......o",
  ],
};

export default icon;
