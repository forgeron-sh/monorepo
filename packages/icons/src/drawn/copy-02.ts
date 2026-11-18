import type { PixelIcon } from "../types";

// Two sheets, the front one carrying two lines of text in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "copy-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    ".########.#",
    ".#......#.#",
    ".#.oooo.#.#",
    ".#......#.#",
    ".#......###",
    ".#.oooo.#",
    ".#......#",
    ".########",
  ],
};

export default icon;
