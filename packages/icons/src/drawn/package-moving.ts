import type { PixelIcon } from "../types";

// Box rushing left, three speed lines behind it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "package-moving",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....#######",
    "....#.#.#.#",
    ".oo.#.###.#",
    "....#.....#",
    "ooo.#.....#",
    "....#.....#",
    ".oo.#.....#",
    "....#######",
  ],
};

export default icon;
