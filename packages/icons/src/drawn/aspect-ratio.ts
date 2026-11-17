import type { PixelIcon } from "../types";

// Aspect ratio: a frame with two corner marks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "aspect-ratio",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#.oo.....#",
    ".#.o......#",
    ".#......o.#",
    ".#.....oo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
