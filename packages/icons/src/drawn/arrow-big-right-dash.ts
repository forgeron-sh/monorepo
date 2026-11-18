import type { PixelIcon } from "../types";

// Big arrow right beside a dash: a dash in the secondary tone, a block arrow outline on its right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-big-right-dash",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "......##",
    ".o.####.#",
    ".o.#.....#",
    ".o.#......#",
    ".o.#......#",
    ".o.#.....#",
    ".o.####.#",
    "......##",
    "......#",
  ],
};

export default icon;
