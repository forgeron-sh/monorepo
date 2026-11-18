import type { PixelIcon } from "../types";

// Newspaper: a front page with its headline in the secondary tone and a line of text, the back page curling out on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "newspaper",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    "...#.oooo.#",
    ".###......#",
    ".#.#......#",
    ".#.#.####.#",
    ".#.#......#",
    ".#.#......#",
    ".#.#......#",
    "..#########",
  ],
};

export default icon;
