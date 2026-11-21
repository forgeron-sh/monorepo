import type { PixelIcon } from "../types";

// Border top: a dotted square with its top edge drawn solid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-top-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooooooooooo",
    "",
    ".#.........#",
    "",
    ".#.........#",
    "",
    ".#.........#",
    "",
    ".#.........#",
    "",
    ".#.#.#.#.#.#",
  ],
};

export default icon;
