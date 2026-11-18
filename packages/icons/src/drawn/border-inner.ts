import type { PixelIcon } from "../types";

// Inner borders: the inner cross solid in the secondary tone, the outline dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-inner",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#.o.#.#",
    ".....o",
    ".#...o...#",
    ".....o",
    ".ooooooooo",
    ".....o",
    ".#...o...#",
    ".....o",
    ".#.#.o.#.#",
  ],
};

export default icon;
