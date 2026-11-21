import type { PixelIcon } from "../types";

// Periscope: a Z-shaped tube with its two mirrors in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "periscope",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "o######",
    "o.....#",
    "o####.#",
    "....#.#",
    "....#.#",
    "....#.#",
    "....#.#####o",
    "....#......o",
    "....#######o",
  ],
};

export default icon;
