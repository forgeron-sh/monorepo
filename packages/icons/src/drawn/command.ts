import type { PixelIcon } from "../types";

// Command key ⌘: four corner loops on a central square, symmetric both ways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "command",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#.#....#.#",
    ".##########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    ".##########",
    ".#.#....#.#",
    ".###....###",
  ],
};

export default icon;
