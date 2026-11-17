import type { PixelIcon } from "../types";

// Hospital sign: an H in a box.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hospital-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
