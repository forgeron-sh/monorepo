import type { PixelIcon } from "../types";

// Two sheets, the front one large enough to carry a plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "copy-plus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    ".########.#",
    ".#......#.#",
    ".#..oo..#.#",
    ".#.oooo.#.#",
    ".#.oooo.###",
    ".#..oo..#",
    ".#......#",
    ".########",
  ],
};

export default icon;
