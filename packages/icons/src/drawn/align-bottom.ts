import type { PixelIcon } from "../types";

// Two bars of different heights standing on a horizontal axis at the bottom; the axis in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-bottom",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    "..#.#",
    "..#.#",
    "..#.#..###",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..###..###",
    "",
    ".oooooooooo",
  ],
};

export default icon;
