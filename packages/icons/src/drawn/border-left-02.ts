import type { PixelIcon } from "../types";

// Left border: the left side solid in the secondary tone, the rest of the square dotted, without the inner lines of `border-left-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-left-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o.#.#.#.#",
    ".o",
    ".o.......#",
    ".o",
    ".o.......#",
    ".o",
    ".o.......#",
    ".o",
    ".o.#.#.#.#",
  ],
};

export default icon;
