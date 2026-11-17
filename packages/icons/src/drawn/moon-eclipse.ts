import type { PixelIcon } from "../types";

// Sun disc with the moon passing over it, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-eclipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...oooo.#",
    "#...oooooo.#",
    "#...oooooo.#",
    "#...oooooo.#",
    "#...oooooo.#",
    ".#...oooo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
