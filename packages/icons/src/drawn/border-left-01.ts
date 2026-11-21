import type { PixelIcon } from "../types";

// Left border: the left side solid in the secondary tone, the rest dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "border-left-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o.#.#.#.#",
    ".o",
    ".o...#...#",
    ".o",
    ".o.#.#.#.#",
    ".o",
    ".o...#...#",
    ".o",
    ".o.#.#.#.#",
  ],
};

export default icon;
