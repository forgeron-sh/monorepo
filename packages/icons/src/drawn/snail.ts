import type { PixelIcon } from "../types";

// Snail: a round shell with its core in the secondary tone, on a long body with a head and two feelers.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "snail",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......####",
    "#..#.#....#",
    ".##.#......#",
    ".##.#..oo..#",
    ".##.#..oo..#",
    ".##.#......#",
    ".##..#....#",
    ".###########",
  ],
};

export default icon;
