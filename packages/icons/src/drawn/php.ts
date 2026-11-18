import type { PixelIcon } from "../types";

// The PHP logo in pixels: the letters php cut out of a flat oval.
// 16×16: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "php",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....########",
    "..############",
    ".#####.########",
    "######.#########",
    "##...#...#...###",
    "##.#.#.#.#.#.###",
    "##...#.#.#...###",
    "##.#######.#####",
    ".#.#######.####",
    "..############",
    "....########",
  ],
};

export default icon;
