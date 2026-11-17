import type { PixelIcon } from "../types";

// Remove, half done: the ring of `add-circle-half-dot`, its left half dotted, a minus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "remove-circle-half-dot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##.####",
    ".........#",
    ".#........#",
    ".#........#",
    "...oooooo.#",
    "...oooooo.#",
    ".#........#",
    ".#........#",
    ".........#",
    "...##.####",
  ],
};

export default icon;
