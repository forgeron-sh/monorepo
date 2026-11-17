import type { PixelIcon } from "../types";

// Align vertical centres: `align-horizontal-center` turned, two bars on a horizontal centre line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-vertical-center",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    "..#.#",
    "..#.#..###",
    "..#.#..#.#",
    ".o#o#oo#o#o",
    "..#.#..#.#",
    "..#.#..###",
    "..#.#",
    "..###",
  ],
};

export default icon;
