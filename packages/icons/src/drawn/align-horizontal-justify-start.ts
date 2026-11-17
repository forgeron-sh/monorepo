import type { PixelIcon } from "../types";

// Justify start: two bars packed against a line on the left, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-horizontal-justify-start",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o",
    ".o.###",
    ".o.#.#..###",
    ".o.#.#..#.#",
    ".o.#.#..#.#",
    ".o.#.#..#.#",
    ".o.#.#..#.#",
    ".o.#.#..###",
    ".o.###",
    ".o",
  ],
};

export default icon;
