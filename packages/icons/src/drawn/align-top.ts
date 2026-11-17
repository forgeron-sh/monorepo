import type { PixelIcon } from "../types";

// Two bars of different heights hanging from a horizontal axis at the top; the axis in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-top",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    "",
    "..###..###",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..###",
    "..#.#",
    "..#.#",
    "..###",
  ],
};

export default icon;
