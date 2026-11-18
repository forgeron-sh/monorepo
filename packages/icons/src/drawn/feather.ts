import type { PixelIcon } from "../types";

// Feather: a quill at 45°, its shaft running through the vane in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "feather",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".....##.o.#",
    "....#..o.#",
    "...#..o.#",
    "...#.o.#",
    "...#o.#",
    "...o##",
    "..o",
    ".o",
    "o",
  ],
};

export default icon;
